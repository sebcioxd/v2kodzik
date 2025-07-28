import { useState, useCallback, useRef, useMemo, useEffect, useTransition } from "react";
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
  weight: number; // File size as weight for weighted average
}

export function useUpload() {
  const router = useRouter();
  // Correct way to use useTransition
  const [isRouting, startTransition] = useTransition();
  const turnstileRef = useRef<TurnstileRef>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [fileProgressMap, setFileProgressMap] = useState<Map<number, FileProgress>>(new Map());
  const [smoothedProgress, setSmoothProgress] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
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

  // Calculate weighted progress based on file sizes
  const weightedProgress = useMemo(() => {
    if (fileProgressMap.size === 0 || totalBytes === 0) return 0;
    
    let totalLoadedBytes = 0;
    
    Array.from(fileProgressMap.values()).forEach(fileProgress => {
      totalLoadedBytes += fileProgress.loaded;
    });
    
    return Math.min(Math.round((totalLoadedBytes / totalBytes) * 100), 100);
  }, [fileProgressMap, totalBytes]);

  // More aggressive smoothing for better UX
  useEffect(() => {
    if (weightedProgress === smoothedProgress || isCancelling) return;
    
    const diff = weightedProgress - smoothedProgress;
    
    // Faster smoothing for small differences, slower for large jumps
    const smoothingFactor = Math.abs(diff) > 10 ? 0.3 : 0.7;
    const step = diff * smoothingFactor;
    
    // Minimum step to prevent stalling
    const minStep = Math.sign(diff) * Math.max(0.5, Math.abs(step));
    
    const timer = setTimeout(() => {
      setSmoothProgress(prev => {
        const next = prev + minStep;
        
        // Snap to target if very close
        if (Math.abs(next - weightedProgress) < 0.5) {
          return weightedProgress;
        }
        
        return Math.round(Math.max(0, Math.min(100, next)));
      });
    }, 30); // 
    
    return () => clearTimeout(timer);
  }, [weightedProgress, smoothedProgress, isCancelling]);

  // Update upload state with smooth progress
  useEffect(() => {
    if (!isCancelling) {
      setUploadState(prev => ({
        ...prev,
        progress: smoothedProgress
      }));
    }
  }, [smoothedProgress, isCancelling]);

  const updateProgress = useCallback((progressData: UploadProgress, files: File[]) => {
    if (isCancelling) return;
    
    setFileProgressMap(prev => {
      const newMap = new Map(prev);
      const file = files[progressData.fileIndex];
      
      if (file) {
        const progress = Math.min(Math.round((progressData.loaded / progressData.total) * 100), 100);
        
        newMap.set(progressData.fileIndex, {
          fileIndex: progressData.fileIndex,
          loaded: progressData.loaded,
          total: progressData.total,
          progress: progress,
          weight: file.size,
        });
      }
      
      return newMap;
    });
  }, [isCancelling]);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!turnstileToken) {
        throw new Error("Proszę ukończyć captche.");
      }

      const cancelTokenSource = createCancelToken();
      
      // Calculate total bytes for weighted progress
      const totalFileBytes = data.files.reduce((sum, file) => sum + file.size, 0);
      setTotalBytes(totalFileBytes);
      
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

        // Step 2: Upload files to S3 with staggered start for smoother progress
        const uploadPromises = data.files.map(async (file, index) => {
          const presignedInfo = presignedData[index];
          
          // Small delay to prevent all files from starting simultaneously
          if (index > 0) {
            await new Promise(resolve => setTimeout(resolve, index * 50));
          }
          
          return uploadFileToS3(
            file,
            presignedInfo.url,
            cancelTokenSource.token,
            (progress) => updateProgress(progress, data.files),
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
        
        // Use startTransition from the destructured hook
        startTransition(() => {
          router.push(`/success?slug=${slug}&time=${time}&type=upload`);
        });
        
        return { slug, time };
      } catch (error) {
        // Check if this was a user-initiated cancellation
        if (axios.isCancel(error)) {
          return { cancelled: true };
        }
        throw error;
      }
    },
    onError: (error: any) => {
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
      setTotalBytes(0);
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
      setTotalBytes(0);
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
      setTotalBytes(0);
      setCancelData(null);
      setIsCancelling(false);
      resetTurnstile();
    }
  }, [uploadState.cancelTokenSource, cancelData, isCancelling, resetTurnstile]);

  return {
    uploadState: {
      ...uploadState,
      isCancelling,
      isRouting // Use the isRouting state from useTransition
    },
    uploadMutation,
    cancelUpload,
    turnstileRef,
    turnstileToken,
    setTurnstileToken,
    resetTurnstile,
  };
}