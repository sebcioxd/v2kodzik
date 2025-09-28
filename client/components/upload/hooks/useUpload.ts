import { useState, useCallback, useRef, useMemo, useEffect, useTransition } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
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

  const [cancelData, setCancelData] = useState<{ slug: string; signature: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  }, []);

  const weightedProgress = useMemo(() => {
    if (fileProgressMap.size === 0 || totalBytes === 0) return 0;
    
    let totalLoadedBytes = 0;
    
    Array.from(fileProgressMap.values()).forEach(fileProgress => {
      totalLoadedBytes += fileProgress.loaded;
    });
    
    return Math.min(Math.round((totalLoadedBytes / totalBytes) * 100), 100);
  }, [fileProgressMap, totalBytes]);

  useEffect(() => {
    if (weightedProgress === smoothedProgress || isCancelling) return;
    
    const diff = weightedProgress - smoothedProgress;
    
    const smoothingFactor = Math.abs(diff) > 10 ? 0.3 : 0.7;
    const step = diff * smoothingFactor;
    
    const minStep = Math.sign(diff) * Math.max(0.5, Math.abs(step));
    
    const timer = setTimeout(() => {
      setSmoothProgress(prev => {
        const next = prev + minStep;
        
        if (Math.abs(next - weightedProgress) < 0.5) {
          return weightedProgress;
        }
        
        return Math.round(Math.max(0, Math.min(100, next)));
      });
    }, 80);
    
    return () => clearTimeout(timer);
  }, [weightedProgress, smoothedProgress, isCancelling]);

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
      
      const totalFileBytes = data.files.reduce((sum, file) => sum + file.size, 0);
      setTotalBytes(totalFileBytes);
      
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
        const presignResponse = await getPresignedUrls(data, turnstileToken);
        const { presignedData, slug, time, finalize_signature, cancel_signature } = presignResponse;

        setCancelData({ slug, signature: cancel_signature });

        const uploadPromises = data.files.map(async (file, index) => {
          const presignedInfo = presignedData[index];
          
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
  
        setSmoothProgress(100);
        setUploadState(prev => ({
          ...prev,
          progress: 100
        }));
        resetTurnstile();
        
        startTransition(() => {
          router.push(`/success?slug=${slug}&time=${time}&type=upload`);
        });
        
        return { slug, time };
      } catch (error) {
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
      
      setFileProgressMap(new Map());
      setSmoothProgress(0);
      setTotalBytes(0);
      setIsCancelling(false);
      
      toast.error(errorMessage);
      resetTurnstile();
    },
    onSuccess: (result) => {
      if (result?.cancelled) return;
      
      // Don't reset states during routing to success page
      if (!result?.slug) {
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
        setIsCancelling(false);
      }
    },
  });

  const cancelUpload = useCallback(async () => {
    if (!uploadState.cancelTokenSource || !cancelData || isCancelling) return;

    setIsCancelling(true);
    
    try {
      uploadState.cancelTokenSource.cancel('Upload cancelled by user');
      
      await apiCancelUpload(cancelData.slug, cancelData.signature);
      
      toast.success("Przesyłanie zostało anulowane", {
        description: "Pliki nie zostały przesłane"
      });
      
    } catch (error) {
      console.warn("Error during upload cancellation cleanup:", error);
      toast.success("Przesyłanie zostało anulowane");
    } finally {
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
      isRouting
    },
    uploadMutation,
    cancelUpload,
    turnstileRef,
    turnstileToken,
    setTurnstileToken,
    resetTurnstile,
  };
}