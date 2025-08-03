import { useCallback } from "react";
import { toast } from "sonner";
import { validateFileName, validateFileSize, validateTotalSize, getMaxSize } from "../upload.utils";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";

export function useFileValidation(selectedTime: string) {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  // Fetch user subscriptions
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (session?.user) {
        try {
          const result = await authClient.subscription.list();
          setSubscriptions(result.data || []);
        } catch (error) {
          console.error('Error fetching subscriptions:', error);
        } finally {
          setIsLoadingSubscriptions(false);
        }
      } else {
        setIsLoadingSubscriptions(false);
      }
    };

    fetchSubscriptions();
  }, [session]);

  // Get active subscription
  const activeSubscription = subscriptions?.find(
    sub => sub.status === "active" || sub.status === "trialing"
  );

  // Get file size limit based on subscription
  const getFileSizeLimit = () => {
    if (!session?.user) {
      return 50 * 1024 * 1024; // 50MB for free users
    }

    if (!activeSubscription) {
      return 50 * 1024 * 1024; // 50MB for free users
    }

    switch (activeSubscription.plan) {
      case "basic":
        return 1 * 1024 * 1024 * 1024; // 1GB
      case "plus":
        return 2 * 1024 * 1024 * 1024; // 2GB
      case "pro":
        return 5 * 1024 * 1024 * 1024; // 5GB
      default:
        return 50 * 1024 * 1024; // 50MB fallback
    }
  };

  const maxSize = getFileSizeLimit();

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
    activeSubscription,
    isLoadingSubscriptions
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}