"use client"
import { FileIcon, Download, Archive, Loader2, FileVideoIcon, FileAudioIcon, FileTextIcon, FileCodeIcon, FileArchiveIcon, FileCogIcon, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface File {
  id: string;
  fileName: string;
  size: number;
  shareId: string;
  storagePath: string;
}

interface FilesProps {
  files: File[];
  totalSize: number;
  createdAt: string;
  storagePath: string;
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

export default function Files({ files, totalSize, createdAt }: FilesProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, boolean>>({});
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Function to format bytes to human readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Updated time remaining calculation
  const formatTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours after creation
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) {
      return "Wygasło";
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleDownload = async (path: string, fileId: string) => {
    setDownloadingFiles(prev => ({ ...prev, [fileId]: true }));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Download failed: ${errorData.message}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('nie udało się pobrać pliku');
    } finally {
      setDownloadingFiles(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Calculate expected preparation time based on file sizes
    // Rough estimation: 1MB takes ~100ms to process
    const totalMB = totalSize / (1024 * 1024);
    const estimatedTimeMs = Math.max(500, Math.min(10000, totalMB * 100));
    const updateInterval = Math.max(50, estimatedTimeMs / 100); // More frequent updates for larger files
    
    let startTime = Date.now();
    
    // More realistic progress simulation based on file sizes
    const progressInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(95, (elapsedTime / estimatedTimeMs) * 100);
      setDownloadProgress(progress);
    }, updateInterval);
    
    try {
      const paths = files.map(file => file.storagePath);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/download/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths }),
      });
      
      clearInterval(progressInterval);
      setDownloadProgress(100); // Download is ready
      
      if (!response.ok) throw new Error('Bulk download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kodzik-${Math.random().toString(36).substring(2, 4)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      clearInterval(progressInterval);
      alert('nie udało się pobrać plików');
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000); // Keep 100% progress visible briefly
    }
  };

  return (
    <main className="flex flex-col items-center justify-center container mx-auto w-full md:max-w-md max-w-sm animate-fade-in-01-text mt-10 ">
      <div className="w-full space-y-4">
        <div className="border border-dashed border-zinc-800 rounded-md p-3 bg-zinc-950/10 text-zinc-400 text-sm flex items-center justify-between">
          <span>Link wygaśnie za:</span>
          <span className="font-medium text-zinc-200">{formatTimeRemaining(createdAt)}</span>
        </div>

        <div className="w-full">
          <Button 
            className="w-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-dashed border-zinc-800"
            size="sm"
            onClick={handleBulkDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Przygotowywanie... {downloadProgress.toFixed(0)}%</span>
              </div>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Pobierz wszystkie ({formatBytes(totalSize)})
              </>
            )}
          </Button>
          
          {isDownloading && (
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
              <div 
                className="bg-zinc-400 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-zinc-400 text-sm border-b border-dashed border-zinc-800 pb-2">
          <span>Pliki ({files.length})</span>
          <span>Łącznie: {formatBytes(totalSize)}</span>
        </div>

        {files.map((file) => (
          <div 
            key={file.id}
            className="border border-dashed border-zinc-800 rounded-md p-4 bg-zinc-950/10 hover:bg-zinc-950/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.fileName)}
                <div className="flex flex-col">
                  <span className="text-zinc-200 text-sm">{file.fileName}</span>
                  <span className="text-zinc-500 text-xs">{formatBytes(file.size)}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                onClick={() => handleDownload(file.storagePath, file.id)}
                disabled={downloadingFiles[file.id]}
              >
                {downloadingFiles[file.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
