import { useState, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { TurnstileRef } from "@/components/turnstile";
import { UploadFormData, UploadProgress, UploadState } from "../upload.types";
import { getPresignedUrls, uploadFileToS3, finalizeUpload } from "../upload.api";
import { createCancelToken } from "../upload.utils";

export function useUpload() {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileRef>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    cancelTokenSource: null,
  });

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  }, []);

  const updateProgress = useCallback((progressMap: Map<number, UploadProgress>, totalBytes: number) => {
    const totalUploaded = Array.from(progressMap.values()).reduce(
      (sum, progress) => sum + progress.loaded,
      0
    );
    const progress = Math.min((totalUploaded / totalBytes) * 100, 100);
    
    setUploadState(prev => {
      const progressDiff = Math.abs(progress - prev.progress);
      if (progressDiff >= 0.5 || progress === 100) {
        return { ...prev, progress: Math.round(progress) };
      }
      return prev;
    });
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      if (!turnstileToken) {
        throw new Error("Proszę ukończyć captche.");
      }

      const cancelTokenSource = createCancelToken();
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
        const { presignedData, slug, time } = presignResponse;

        // Step 2: Upload files to S3
        const totalBytes = data.files.reduce((acc, file) => acc + file.size, 0);
        const progressMap = new Map<number, UploadProgress>();

        const uploadPromises = data.files.map(async (file, index) => {
          const presignedInfo = presignedData[index];
          
          return uploadFileToS3(
            file,
            presignedInfo.url,
            cancelTokenSource.token,
            (progress) => {
              progressMap.set(index, progress);
              updateProgress(progressMap, totalBytes);
            },
            index
          );
        });

        await Promise.all(uploadPromises);

        // Step 3: Finalize upload
        setUploadState(prev => ({ ...prev, progress: 100 }));
        await finalizeUpload(slug, data.files, data, time);

        // Success
        resetTurnstile();
        router.push(`/success?slug=${slug}&time=${time}&type=upload`);
        
        return { slug, time };
      } catch (error) {
        if (axios.isCancel(error)) {
          throw new Error("Upload cancelled");
        }
        throw error;
      }
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      
      let errorMessage = "Wystąpił błąd podczas przesyłania plików";
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          errorMessage = "Przekroczono limit żądań. Odczekaj chwilę i spróbuj ponownie.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message === "Upload cancelled") {
        errorMessage = "Przesyłanie zostało anulowane";
      }

      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0, 
        error: errorMessage,
        cancelTokenSource: null 
      }));
      
      toast.error(errorMessage);
      resetTurnstile();
    },
    onSuccess: () => {
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0, 
        error: null,
        cancelTokenSource: null 
      }));
    },
  });

  const cancelUpload = useCallback(() => {
    if (uploadState.cancelTokenSource) {
      uploadState.cancelTokenSource.cancel('Upload cancelled by user');
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false, 
        progress: 0, 
        error: "Przesyłanie zostało anulowane",
        cancelTokenSource: null 
      }));
    }
  }, [uploadState.cancelTokenSource]);

  return {
    uploadState,
    uploadMutation,
    cancelUpload,
    turnstileRef,
    turnstileToken,
    setTurnstileToken,
    resetTurnstile,
  };
}