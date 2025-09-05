import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { validateFileName, validateFileSize, validateTotalSize, getMaxSize, sanitizeFileName } from "../upload.utils";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";

export function useFileValidation(selectedTime: string) {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [filenameChanges, setFilenameChanges] = useState<Map<string, string>>(new Map());

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

  const sanitizeFile = useCallback((file: File): File => {
    const sanitizedName = sanitizeFileName(file.name);
    if (sanitizedName !== file.name) {
      // Store the filename change for inline display
      setFilenameChanges(prev => new Map(prev).set(file.name, sanitizedName));
      
      // Create a new File object with the sanitized name
      return new File([file], sanitizedName, {
        type: file.type,
        lastModified: file.lastModified
      });
    }
    return file;
  }, []);

  const clearFilenameChange = useCallback((originalName: string) => {
    setFilenameChanges(prev => {
      const newMap = new Map(prev);
      newMap.delete(originalName);
      return newMap;
    });
  }, []);

  const validateFile = useCallback((file: File): string | null => {
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

    // Sanitize and validate individual files
    const validFiles: File[] = [];
    let hasErrors = false;

    files.forEach(file => {
      // First sanitize the file
      const sanitizedFile = sanitizeFile(file);
      
      // Then validate the sanitized file
      const error = validateFile(sanitizedFile);
      if (error) {
        toast.error(`${sanitizedFile.name}: ${error}`);
        hasErrors = true;
      } else {
        validFiles.push(sanitizedFile);
      }
    });

    return { validFiles, hasErrors };
  }, [validateFile, sanitizeFile, maxSize]);

  const onFileReject = useCallback((file: File, message: string) => {
    toast.error(`${file.name}: ${message}`);
  }, []);

  return {
    validateFile,
    validateFiles,
    sanitizeFile,
    onFileReject,
    maxSize,
    activeSubscription,
    isLoadingSubscriptions,
    filenameChanges,
    clearFilenameChange
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}