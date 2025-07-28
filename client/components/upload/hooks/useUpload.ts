import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { TurnstileRef } from "@/components/turnstile";
import { UploadFormData, UploadProgress, UploadState } from "../upload.types";
import { getPresignedUrls, uploadFileToS3, finalizeUpload, cancelUpload as apiCancelUpload } from "../upload.api";
import { createCancelToken } from "../upload.utils";

interface FileProgress {
  fileIndex: number;
  loaded: number;
  total: number;
  progress: number;
}

export function useUpload() {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileRef>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [fileProgressMap, setFileProgressMap] = useState<Map<number, FileProgress>>(new Map());
  const [smoothedProgress, setSmoothProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    cancelTokenSource: null,
  });

  // Add state for cancel data and cancellation status
  const [cancelData, setCancelData] = useState<{ slug: string; signature: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  }, []);

  // Calculate average progress across all files
  const averageProgress = useMemo(() => {
    if (fileProgressMap.size === 0) return 0;
    
    const totalProgress = Array.from(fileProgressMap.values()).reduce(
      (sum, fileProgress) => sum + fileProgress.progress,
      0
    );
    
    return Math.round(totalProgress / fileProgressMap.size);
  }, [fileProgressMap]);

  // Smooth progress updates to prevent chunkiness
  useEffect(() => {
    if (averageProgress === smoothedProgress || isCancelling) return;
    
    const diff = averageProgress - smoothedProgress;
    const step = Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.85);
    
    const timer = setTimeout(() => {
      setSmoothProgress(prev => {
        const next = prev + step;
        return Math.abs(next - averageProgress) < 1 ? averageProgress : Math.round(next);
      });
    }, 50);
    
    return () => clearTimeout(timer);
  }, [averageProgress, smoothedProgress, isCancelling]);

  // Update upload state with smooth progress
  useEffect(() => {
    if (!isCancelling) {
      setUploadState(prev => ({
        ...prev,
        progress: smoothedProgress
      }));
    }
  }, [smoothedProgress, isCancelling]);

  const updateProgress = useCallback((progressData: UploadProgress) => {
    if (isCancelling) return;
    
    setFileProgressMap(prev => {
      const newMap = new Map(prev);
      const progress = Math.min(Math.round((progressData.loaded / progressData.total) * 100), 100);
      
      newMap.set(progressData.fileIndex, {
        fileIndex: progressData.fileIndex,
        loaded: progressData.loaded,
        total: progressData.total,
        progress: progress,
      });
      
      return newMap;
    });
  }, [isCancelling]);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!turnstileToken) {
        throw new Error("Proszę ukończyć captche.");
      }

      const cancelTokenSource = createCancelToken();
      
      // Reset progress tracking and cancel state
      setFileProgressMap(new Map());
      setSmoothProgress(0);
      setIsCancelling(false);
      
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: true, 
        progress: 0, 
        error: null,
        cancelTokenSource 
      }));

      try {
        // Step 1: Get presigned URLs
        const presignResponse = await getPresignedUrls(data, turnstileToken);
        const { presignedData, slug, time, finalize_signature, cancel_signature } = presignResponse;

        // Store cancel data when we get it
        setCancelData({ slug, signature: cancel_signature });

        // Step 2: Upload files to S3
        const uploadPromises = data.files.map(async (file, index) => {
          const presignedInfo = presignedData[index];
          
          return uploadFileToS3(
            file,
            presignedInfo.url,
            cancelTokenSource.token,
            updateProgress,
            index
          );
        });

        await Promise.all([
          Promise.all(uploadPromises),
          finalizeUpload(slug, data.files, data, time, finalize_signature, cancel_signature)
        ]);
  
        // Success - set to 100% immediately
        setSmoothProgress(100);
        resetTurnstile();
        router.push(`/success?slug=${slug}&time=${time}&type=upload`);
        
        return { slug, time };
      } catch (error) {
        // Check if this was a user-initiated cancellation
        if (axios.isCancel(error)) {
          // Don't throw for cancellation - it's handled separately
          return { cancelled: true };
        }
        throw error;
      }
    },
    onError: (error: any) => {
      // Don't handle cancellation errors here anymore
      if (error?.cancelled) return;
      
      console.error("Upload error:", error);
      
      let errorMessage = "Wystąpił błąd podczas przesyłania plików";
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          errorMessage = "Przekroczono limit żądań. Odczekaj chwilę i spróbuj ponownie.";
        } else if (error.response?.data?.error?.name === "ZodError") {
          try {
            const zodErrors = JSON.parse(error.response.data.error.message);
            errorMessage = zodErrors[0]?.message || "Błąd walidacji formularza";
          } catch {
            errorMessage = "Błąd walidacji formularza";
          }
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0, 
        error: errorMessage,
        cancelTokenSource: null 
      }));
      
      // Reset progress tracking
      setFileProgressMap(new Map());
      setSmoothProgress(0);
      setIsCancelling(false);
      
      toast.error(errorMessage);
      resetTurnstile();
    },
    onSuccess: (result) => {
      // Don't reset state for cancelled uploads
      if (result?.cancelled) return;
      
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0, 
        error: null,
        cancelTokenSource: null 
      }));
      
      // Reset progress tracking
      setFileProgressMap(new Map());
      setSmoothProgress(0);
      setIsCancelling(false);
    },
  });

  const cancelUpload = useCallback(async () => {
    if (!uploadState.cancelTokenSource || !cancelData || isCancelling) return;

    setIsCancelling(true);
    
    try {
      // Cancel the axios requests
      uploadState.cancelTokenSource.cancel('Upload cancelled by user');
      
      // Call API to cleanup server-side resources
      await apiCancelUpload(cancelData.slug, cancelData.signature);
      
      // Show success message for cancellation
      toast.success("Przesyłanie zostało anulowane", {
        description: "Pliki nie zostały przesłane"
      });
      
    } catch (error) {
      console.warn("Error during upload cancellation cleanup:", error);
      // Still show success since the main cancellation worked
      toast.success("Przesyłanie zostało anulowane");
    } finally {
      // Reset all state
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0, 
        error: null,
        cancelTokenSource: null 
      }));
      
      setFileProgressMap(new Map());
      setSmoothProgress(0);
      setCancelData(null);
      setIsCancelling(false);
      resetTurnstile();
    }
  }, [uploadState.cancelTokenSource, cancelData, isCancelling, resetTurnstile]);

  return {
    uploadState: {
      ...uploadState,
      isCancelling
    },
    uploadMutation,
    cancelUpload,
    turnstileRef,
    turnstileToken,
    setTurnstileToken,
    resetTurnstile,
  };
}