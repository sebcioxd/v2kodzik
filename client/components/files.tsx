"use client"
import { FileIcon, Download, Archive, Loader2, FileVideoIcon, FileAudioIcon, FileTextIcon, FileCodeIcon, FileArchiveIcon, FileCogIcon, ImageIcon, Share2, Lock, Key, Link as LinkIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import axios, { AxiosProgressEvent } from "axios";
import { BlobWriter, ZipWriter, BlobReader } from "@zip.js/zip.js";
import { toast } from "sonner";
import { useSearchParams } from 'next/navigation';
import { formatTimeRemaining } from "@/lib/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface File {
  id: string;
  fileName: string;
  size: number;
  shareId: string;
  storagePath: string;
  lastModified: number;
  contentType: string;
}

interface FilesProps {
  files: File[];
  totalSize: number;
  createdAt: string;
  expiresAt: string;
  storagePath: string;
  slug: string;
  fileId: string;
  private: boolean;
  autoVerified?: boolean;
  verifiedByCookie?: boolean;
  autoVerifiedPrivateStatus?: boolean;
}

interface DownloadingFiles {
    [key: string]: boolean;
}

interface DownloadProgress {
    [key: string]: number;
}

interface FileProgress {
    downloadProgress: number;
    compressionProgress: number;
    fileName: string;
    status: 'pending' | 'downloading' | 'compressing' | 'complete' | 'error';
}

interface FileDownloadProgress {
    [key: string]: FileProgress;
}

interface BulkDownloadState {
    totalProgress: number;
    currentFile: string;
    filesProgress: FileDownloadProgress;
    status: 'preparing' | 'downloading' | 'compressing' | 'complete' | 'error';
}

interface RateLimitError {
    message: string;
    remaining_requests: number;
    retry_after: number;
}

function getFileIcon(fileName: string, fileType?: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  // Image files
  if (
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"].includes(extension) ||
    fileType?.startsWith("image/")
  ) {
    return <ImageIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Video files
  if (
    ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"].includes(extension) ||
    fileType?.startsWith("video/")
  ) {
    return <FileVideoIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Audio files
  if (
    ["mp3", "wav", "ogg", "m4a", "flac", "aac"].includes(extension) ||
    fileType?.startsWith("audio/")
  ) {
    return <FileAudioIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Text/Document files
  if (
    ["txt", "md", "rtf", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension) ||
    fileType?.startsWith("text/")
  ) {
    return <FileTextIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Code files
  if (
    ["html", "css", "js", "jsx", "ts", "tsx", "json", "xml", "php", "py", "rb", 
     "java", "c", "cpp", "cs", "go", "rust", "swift", "kotlin", "dart"].includes(extension)
  ) {
    return <FileCodeIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Archive files
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "iso"].includes(extension)) {
    return <FileArchiveIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Executable/Application files
  if (
    ["exe", "msi", "app", "apk", "deb", "rpm", "dmg"].includes(extension) ||
    fileType?.startsWith("application/")
  ) {
    return <FileCogIcon className="h-5 w-5 text-zinc-400" />;
  }

  // Default file icon
  return <FileIcon className="h-5 w-5 text-zinc-400" />;
}

export default function Files({ files, totalSize, createdAt, expiresAt, storagePath, slug, fileId, private: isPrivateAccess, autoVerified, verifiedByCookie, autoVerifiedPrivateStatus }: FilesProps) {
  const searchParams = useSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<DownloadingFiles>({});
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({});
  const [isSharing, setIsSharing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(isPrivateAccess);
  const [accessCode, setAccessCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [filesData, setFilesData] = useState<File[]>(files);
  const [filesTotalSize, setFilesTotalSize] = useState<number>(totalSize);
  const [fileStoragePath, setFileStoragePath] = useState<string>(storagePath);
  const [remainingRequests, setRemainingRequests] = useState<number>(0);
  const [bulkDownloadState, setBulkDownloadState] = useState<BulkDownloadState>({
    totalProgress: 0,
    currentFile: '',
    filesProgress: {},
    status: 'preparing'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (autoVerified && autoVerifiedPrivateStatus) {
      toast.success('Automatycznie zweryfikowano dostęp', {
        description: 'Dostęp przyznany - jesteś właścicielem tego linku',
      });
    } else if (verifiedByCookie) {
      toast.success('Automatycznie zweryfikowano dostęp', {
        description: 'Poprzednia weryfikacja przebiegła pomyślnie',
      });
    }
  }, [autoVerified, verifiedByCookie]);

  // Function to format bytes to human readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bajtów';
    const k = 1024;
    const sizes = ['Bajty', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Add this helper function to get content type label
  function getContentTypeLabel(contentType: string, fileName: string): string {
    // If no content type, extract and return the file extension
    if (!contentType) {
      const extension = fileName.split('.').pop()?.toUpperCase();
      return extension ? `Plik ${extension}` : 'Nieznany typ pliku';
    }

    const CONTENT_TYPES = {
      "image/png": "Obraz PNG",
      "image/jpeg": "Obraz JPEG",
      "image/jpg": "Obraz JPG",
      "image/gif": "Animacja GIF",
      "image/webp": "Obraz WebP",
      "video/mp4": "Video MP4",
      "video/webm": "Video WebM",
      "video/ogg": "Video OGG",
      "application/pdf": "Dokument PDF",
      "application/msword": "Dokument Word",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Dokument Word",
      "text/plain": "Plik tekstowy",
      "application/json": "Plik JSON",
      "text/html": "Plik HTML",
      "text/css": "Arkusz stylów CSS",
      "text/javascript": "Plik JavaScript",
      "text/php": "Plik PHP",
      "text/python": "Plik Python",
      "text/ruby": "Plik Ruby",
      "text/perl": "Plik Perl",
      "text/shell": "Plik Shell",
      "text/sql": "Plik SQL",
      "application/x-zip-compressed": "Archiwum ZIP",
      "application/x-rar-compressed": "Archiwum RAR",
      "application/x-7z-compressed": "Archiwum 7-Zip",
      "application/x-tar": "Archiwum",
      "application/x-gzip": "Archiwum",
      "application/x-bzip2": "Archiwum",
    };

    return CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES] || contentType;
  }


  const handleDownload = async (path: string, fileId: string): Promise<void> => {
    setDownloadingFiles((prev) => ({ ...prev, [fileId]: true }));
    setDownloadProgress((prev) => ({ ...prev, [fileId]: 0 }));
    
    try {
        // Get presigned URL from server
        const presignedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/download/${path}`, {
            credentials: 'include',
        });
        
        if (presignedResponse.status === 429) {
            const rateLimitData = await presignedResponse.json() as RateLimitError;
            toast.error(`Przekroczono limit żądań. Spróbuj ponownie za ${rateLimitData.retry_after} sekund. Pozostałe próby: ${rateLimitData.remaining_requests}`);
            return;
        }
        
        if (!presignedResponse.ok) {
            throw new Error('Failed to get download URL');
        }
        
        const { url } = await presignedResponse.json();
        
        // Download file using axios for progress tracking
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'blob',
            headers: {
                "Accept": "*/*",
            },
            withCredentials: false,
            onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
                if (progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    setDownloadProgress((prev) => ({ ...prev, [fileId]: progress }));
                }
            },
        });
        
        // Create and trigger download
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = path.split('/').pop() || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
            toast.error(`Przekroczono limit żądań. Odczekaj chwilę i spróbuj ponownie.`);
        } else {
            toast.error('Nie udało się pobrać pliku. Użyj pobierania w formie zip.');
        }
    } finally {
        setDownloadingFiles((prev) => ({ ...prev, [fileId]: false }));
        // Clear progress after a short delay to show completion
        setTimeout(() => {
            setDownloadProgress((prev) => {
                const newProgress = { ...prev };
                delete newProgress[fileId];
                return newProgress;
            });
        }, 1000);
    }
  };

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    setBulkDownloadState({
        totalProgress: 0,
        currentFile: '',
        filesProgress: {},
        status: 'preparing'
    });

    try {
        // Initialize progress for all files
        const initialProgress: FileDownloadProgress = {};
        filesData.forEach(file => {
            initialProgress[file.id] = {
                downloadProgress: 0,
                compressionProgress: 0,
                fileName: file.fileName,
                status: 'pending'
            };
        });

        setBulkDownloadState(prev => ({
            ...prev,
            filesProgress: initialProgress,
            status: 'downloading'
        }));

        // Get presigned URLs from server
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/download/bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                paths: filesData.map(file => file.storagePath)
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get download URLs');
        }

        const { urls } = await response.json();
        const totalFiles = urls.length;
        let completedFiles = 0;

        // Create zip writer
        const zipWriter = new ZipWriter(new BlobWriter("application/zip"));

        // Download each file
        await Promise.all(urls.map(async ({ url, fileName }: { url: string, fileName: string }) => {
            try {
                setBulkDownloadState(prev => ({
                    ...prev,
                    currentFile: fileName
                }));

                const fileId = filesData.find(f => f.fileName === fileName)?.id || fileName;

                const response = await axios({
                    url,
                    method: 'GET',
                    responseType: 'blob',
                    headers: {
                        "Accept": "*/*",
                    },
                    withCredentials: false,
                    onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
                        if (progressEvent.total) {
                            const fileProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                            
                            setBulkDownloadState(prev => {
                                const updatedFileProgress: FileDownloadProgress = {
                                    ...prev.filesProgress,
                                    [fileId]: {
                                        ...prev.filesProgress[fileId],
                                        downloadProgress: fileProgress,
                                        status: 'downloading'
                                    }
                                };

                                // Calculate total progress based on download phase only
                                const totalBytes = filesData.reduce((acc, file) => acc + file.size, 0);
                                let weightedProgress = 0;
                                
                                filesData.forEach(file => {
                                    const fileProgress = updatedFileProgress[file.id]?.downloadProgress || 0;
                                    const weight = file.size / totalBytes;
                                    weightedProgress += fileProgress * weight;
                                });

                                return {
                                    ...prev,
                                    filesProgress: updatedFileProgress,
                                    totalProgress: Math.round(weightedProgress)
                                };
                            });
                        }
                    }
                });

                // Update status to show file is ready for compression
                setBulkDownloadState(prev => ({
                    ...prev,
                    filesProgress: {
                        ...prev.filesProgress,
                        [fileId]: {
                            ...prev.filesProgress[fileId],
                            downloadProgress: 100,
                            status: 'compressing'
                        }
                    }
                }));

                // Add to zip using zip.js
                await zipWriter.add(fileName, new BlobReader(response.data), {
                    onprogress: async (progress: number, total: number) => {
                        const percent = Math.round((progress / total) * 100);
                        setBulkDownloadState(prev => ({
                            ...prev,
                            filesProgress: {
                                ...prev.filesProgress,
                                [fileId]: {
                                    ...prev.filesProgress[fileId],
                                    compressionProgress: percent,
                                    status: 'compressing'
                                }
                            },
                            totalProgress: prev.totalProgress
                        }));
                    }
                });

                // Update file status to complete
                setBulkDownloadState(prev => ({
                    ...prev,
                    filesProgress: {
                        ...prev.filesProgress,
                        [fileId]: {
                            ...prev.filesProgress[fileId],
                            downloadProgress: 100,
                            compressionProgress: 100,
                            status: 'complete'
                        }
                    }
                }));

                completedFiles++;

            } catch (error) {
                console.error(`Failed to download ${fileName}:`, error);
                setBulkDownloadState(prev => ({
                    ...prev,
                    filesProgress: {
                        ...prev.filesProgress,
                        [fileId]: {
                            ...prev.filesProgress[fileId],
                            status: 'error'
                        }
                    }
                }));
            }
        }));

        // Update status to compressing
        setBulkDownloadState(prev => ({
            ...prev,
            status: 'compressing'
        }));

        // Close the zip writer and get the final blob
        const zipBlob = await zipWriter.close();

        // Trigger download
        const downloadUrl = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${slug}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        a.remove();

        setBulkDownloadState(prev => ({
            ...prev,
            status: 'complete',
            totalProgress: 100
        }));

    } catch (error) {
        console.error('Bulk download failed:', error);
        
        // Handle rate limit error (429)
        if (axios.isAxiosError(error) && error.response?.status === 429) {
            const rateLimitData = error.response.data as RateLimitError;
            setBulkDownloadState(prev => ({
                ...prev,
                status: 'error',
                filesProgress: {
                    ...prev.filesProgress,
                    error: {
                        downloadProgress: 0,
                        compressionProgress: 0,
                        fileName: '',
                        status: 'error'
                    }
                }
            }));
            
            // Add rate limit error display in the UI
            toast.error(`Przekroczono limit żądań. Spróbuj ponownie za ${rateLimitData.retry_after} sekund. Pozostałe próby: ${rateLimitData.remaining_requests}`);
        } else {
            setBulkDownloadState(prev => ({
                ...prev,
                status: 'error'
            }));
            toast.error('Nie udało się pobrać plików. Spróbuj ponownie później.');
        }
    } finally {
        setTimeout(() => {
            setIsDownloading(false);
            setBulkDownloadState({
                totalProgress: 0,
                currentFile: '',
                filesProgress: {},
                status: 'preparing'
            });
        }, 1000);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared Files',
          url: `https://www.dajkodzik.pl/${slug}`
        });
      } else {
        await navigator.clipboard.writeText(`https://www.dajkodzik.pl/${slug}`);
        toast.success('Link skopiowany do schowka!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Nie udało się udostępnić linku');
    } finally {
      setIsSharing(false);
    }
  };

  // Function to verify access code
  const verifyAccessCode = async () => {
    if (accessCode.length !== 6) {
      toast.error("Kod dostępu musi zawierać 6 znaków");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/share/verify?slug=${slug}&accessCode=${accessCode}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update the files data with what's returned from verification
        if (data.files) setFilesData(data.files);
        if (data.totalSize !== undefined) setFilesTotalSize(data.totalSize);
        if (data.storagePath) setFileStoragePath(data.storagePath);
        setAccessGranted(true);
      } else {
        toast.error(data.message || "Nieprawidłowy kod dostępu");
        setRemainingRequests(data.remaining_requests);
      }
    } catch (error) {
      toast.error("Przekroczono limit żądań. Odczekaj chwilę i spróbuj ponownie.");
    } finally {
      setIsVerifying(false);
    }
  };

  // If private and access not granted, show access code input
  if (isPrivate && !accessGranted) {
    return (
      <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-sm max-w-sm animate-fade-in-01-text mt-10">
        <div className="w-full space-y-4">
          <div className="border border-dashed border-zinc-800 rounded-md p-6 bg-zinc-950/10 backdrop-blur-sm">
            <h2 className="text-xl text-center font-semibold tracking-tight text-zinc-100">
              Dostęp do linku <span className="text-zinc-400">{slug}</span> jest chroniony
            </h2>
            <p className="mb-4 mt-1 text-center text-sm text-zinc-400">
              Wprowadź kod dostępu, a następnie kliknij <br /> 
              <span className="text-zinc-200 font-medium">"Potwierdź kod dostępu"</span>
            </p>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <InputOTP
                  maxLength={6}
                  value={accessCode}
                  onChange={setAccessCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot 
                      className="h-8 bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      index={0}
                    />
                    <InputOTPSlot 
                      className="h-8 bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      index={1}
                    />
                    <InputOTPSlot 
                      className="h-8 bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      index={2}
                    />
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-zinc-400"/>
                  <InputOTPGroup>
                    <InputOTPSlot 
                      className="h-8 bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      index={3}
                    />
                    <InputOTPSlot 
                      className="h-8 bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      index={4}
                    />
                    <InputOTPSlot 
                      className="h-8 bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200 focus-visible:ring-0 focus-visible:ring-offset-0" 
                      index={5}
                    />  
                  </InputOTPGroup>
                </InputOTP>

                <div className="flex flex-col my-4 border-t border-dashed border-zinc-800 pt-2">
                  <p className="text-zinc-600 mb-1 text-xs">Informacje o udostępnionym linku:</p>
                  <p className="text-zinc-700 text-xs">Link wygaśnie za: {formatTimeRemaining(createdAt, expiresAt)}</p>
                  <p className="text-zinc-700 text-xs">Slug (link): {slug}</p>
                  <p className="text-zinc-700 text-xs">ID linku: {fileId}</p>
                  {remainingRequests > 0 && <p className="text-zinc-700 text-xs">Pozostałe żądania: {remainingRequests}</p>}
                </div>
                {codeError && <p className="text-red-400 text-sm mt-2">{codeError}</p>}
              </div>
              
              <Button
                className="w-full bg-zinc-900/20 border border-dashed border-zinc-800 backdrop-blur-sm hover:bg-zinc-800 text-zinc-300"
                onClick={verifyAccessCode}
                disabled={isVerifying || accessCode.length !== 6}
                size="sm"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Weryfikacja...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Key className="h-4 w-4 mr-2" />
                    Potwierdź kod dostępu
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }



  const unixToDate = (unix: number | string) => {
    
    if (!unix) return "Brak daty";
    
    try {
      const unixNumber = typeof unix === 'string' ? parseInt(unix, 10) : unix;
      if (isNaN(unixNumber)) {
        return "Nieprawidłowa data (błąd konwersji)";
      }
      
      const date = new Date(unixNumber);

      if (isNaN(date.getTime())) {
        return "Nieprawidłowa data (NaN)";
      }
      
      return date.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('Błąd podczas przetwarzania daty:', error);
      return "Nieprawidłowa data (błąd)";
    }
  };
  return (
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-md max-w-sm animate-fade-in-01-text mt-10">
      <div className="w-full space-y-4 animate-fade-in-01-text">
        <div className="flex flex-col gap-2">
          <div className="border-b border-dashed border-zinc-800 p-3 bg-zinc-950/10 backdrop-blur-sm text-zinc-400 text-sm flex items-center justify-between">
            <span>dajkodzik.pl/<span className="font-medium text-zinc-200">{slug}</span></span>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10 backdrop-blur-sm text-zinc-400 text-sm flex items-center justify-between">
          <span>Link wygaśnie za:</span>
          <span className="font-medium text-zinc-200">{formatTimeRemaining(createdAt, expiresAt)}</span>
        </div>

        <Button 
          className="w-full bg-zinc-900/20 border border-dashed border-zinc-800 backdrop-blur-sm hover:bg-zinc-800 text-zinc-300"
          size="sm"
          onClick={handleBulkDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>
                {bulkDownloadState.status === 'preparing' && 'Przygotowywanie...'}
                {bulkDownloadState.status === 'downloading' && `Pobieranie... ${bulkDownloadState.totalProgress}%`}
                {bulkDownloadState.status === 'compressing' && 'Kompresowanie...'}
                {bulkDownloadState.status === 'complete' && 'Zakończono!'}
              </span>
            </div>
          ) : (
            <>
              <Archive className="h-4 w-4 mr-2" />
              Pobierz wszystkie i skompresuj (.ZIP)
            </>
          )}
        </Button>

        {isDownloading && (
          <div className="w-full space-y-2 animate-fade-in-01-text">
            <div className="w-full bg-zinc-800/30 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ease-out ${
                  bulkDownloadState.totalProgress === 100 ? 'bg-green-400' : 'bg-zinc-400'
                }`}
                style={{ width: `${bulkDownloadState.totalProgress}%` }}
              ></div>
            </div>
            
            
            
            <div className="grid gap-1">
                {Object.entries(bulkDownloadState.filesProgress).map(([fileId, file]) => (
                    <div key={fileId} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 truncate max-w-[60%]">{file.fileName}</span>
                        <div className="flex items-center gap-2">
                            {file.status === 'downloading' && (
                                <div className="flex items-center">
                                    <span className="text-zinc-500">↓</span>
                                    <span className="text-zinc-400 ml-1">{file.downloadProgress}%</span>
                                </div>
                            )}
                            {file.status === 'compressing' && (
                                <div className="flex items-center">
                                    <span className="text-zinc-500">📦</span>
                                    <span className="text-zinc-400 ml-1">{file.compressionProgress}%</span>
                                </div>
                            )}
                            {file.status === 'complete' && (
                                <span className="text-green-400">✓</span>
                            )}
                            {file.status === 'error' && (
                                <span className="text-red-400">×</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-zinc-400 text-sm border-b border-dashed border-zinc-800 pb-2">
          <span>Pliki ({filesData.length})</span>
          <span>Łącznie: {formatBytes(filesTotalSize)}</span>
        </div>

        {filesData.map((file) => (
          <div 
            key={file.id}
            className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10 backdrop-blur-sm hover:bg-zinc-950/20 transition-colors animate-slide-in-bottom"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.fileName)}
                <div className="flex flex-col">
                  <span className="text-zinc-200 text-sm">{file.fileName} </span>
                  <span className="text-zinc-500 text-xs">{formatBytes(file.size)}</span>
                  
                </div>
              </div>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  onClick={() => setSelectedFile(file)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  onClick={() => handleDownload(file.storagePath, file.id)}
                  disabled={!!downloadingFiles[file.id]}
                >
                  {downloadingFiles[file.id] ? (
                    <div className="flex items-center">
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      <span>{downloadProgress[file.id] ?? 0}%</span>
                    </div>
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Progress bar */}
            {downloadProgress[file.id] !== undefined && (
              <div className="mt-2 w-full">
                <div className="w-full bg-zinc-800 rounded-full h-1">
                  <div 
                    className="bg-zinc-400 h-1 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress[file.id]}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="border border-dashed border-zinc-800 bg-zinc-950/70 backdrop-blur-sm text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-200 tracking-tight flex items-center text-md gap-2">
              {getFileIcon(selectedFile?.fileName || "", selectedFile?.contentType)}
              {selectedFile?.fileName}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Szczegółowe informacje o pliku
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-800">
                <span className="text-zinc-400 text-sm">Typ pliku</span>
                <span className="text-zinc-200 text-sm">{selectedFile && getContentTypeLabel(selectedFile.contentType, selectedFile.fileName)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-800">
                <span className="text-zinc-400 text-sm">Rozmiar</span>
                <span className="text-zinc-200 text-sm">{selectedFile && formatBytes(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-800">
                <span className="text-zinc-400 text-sm">ID pliku</span>
                <span className="text-zinc-200 text-sm">{selectedFile?.id}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-zinc-800">
                <span className="text-zinc-400 text-sm">Ostatnia modyfikacja pliku</span>
                <span className="text-zinc-200 text-sm">{unixToDate(selectedFile?.lastModified ?? 0)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
