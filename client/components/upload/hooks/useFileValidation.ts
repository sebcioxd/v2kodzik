import { useCallback } from "react";
import { toast } from "sonner";
import { validateFileName, validateFileSize, validateTotalSize, getMaxSize } from "../upload.utils";

export function useFileValidation(selectedTime: string) {
  const maxSize = getMaxSize(selectedTime);

  const validateFile = useCallback((file: File): string | null => {
    // Check filename
    const filenameError = validateFileName(file.name);
    if (filenameError) return filenameError;

    // Check file size
    const sizeError = validateFileSize(file, maxSize);
    if (sizeError) return sizeError;

    return null;
  }, [maxSize]);

  const validateFiles = useCallback((files: File[]): { validFiles: File[], hasErrors: boolean } => {
    // Validate total size first
    const totalSizeError = validateTotalSize(files, maxSize);
    if (totalSizeError) {
      toast.error(totalSizeError);
      return { validFiles: [], hasErrors: true };
    }

    // Validate individual files
    const validFiles: File[] = [];
    let hasErrors = false;

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        hasErrors = true;
      } else {
        validFiles.push(file);
      }
    });

    return { validFiles, hasErrors };
  }, [validateFile, maxSize]);

  const onFileReject = useCallback((file: File, message: string) => {
    toast.error(`${file.name}: ${message}`);
  }, []);

  return {
    validateFile,
    validateFiles,
    onFileReject,
    maxSize,
  };
}