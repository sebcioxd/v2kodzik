"use client";

import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, XCircle, AlertTriangle, FileText, CheckCircle2, Clock
} from "lucide-react";
import { formatBytes } from "./upload.utils";

// Progress states enum for better type safety
export enum UploadProgressState {
  PREPARING = 'preparing',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  ROUTING = 'routing',
  CANCELLING = 'cancelling'
}

interface UploadProgressViewProps {
  files: File[];
  progressPercentage: number;
  totalSize: number;
  cancelUpload: () => void;
  isCancelling?: boolean;
  isRouting?: boolean;
  estimatedTimeRemaining?: number; // in seconds
  uploadSpeed?: number; // bytes per second
}

// Helper function to get progress state
const getProgressState = (
  progressPercentage: number, 
  isCancelling: boolean, 
  isRouting: boolean
): UploadProgressState => {
  if (isCancelling) return UploadProgressState.CANCELLING;
  if (isRouting) return UploadProgressState.ROUTING;
  if (progressPercentage === 0) return UploadProgressState.PREPARING;
  if (progressPercentage === 100) return UploadProgressState.PROCESSING;
  return UploadProgressState.UPLOADING;
};

// Helper function to format time remaining
const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

// Helper function to format upload speed
const formatUploadSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const UploadProgressView = memo(({ 
  files, 
  progressPercentage, 
  totalSize, 
  cancelUpload,
  isCancelling = false,
  isRouting = false,
  estimatedTimeRemaining,
  uploadSpeed
}: UploadProgressViewProps) => {
  
  const progressState = useMemo(() => 
    getProgressState(progressPercentage, isCancelling, isRouting), 
    [progressPercentage, isCancelling, isRouting]
  );

  // Calculate uploaded bytes
  const uploadedBytes = useMemo(() => 
    Math.round((progressPercentage / 100) * totalSize), 
    [progressPercentage, totalSize]
  );

  // Get state-specific styling and content
  const stateConfig = useMemo(() => {
    switch (progressState) {
      case UploadProgressState.ROUTING:
        return {
          icon: <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />,
          title: 'Przekierowywanie...',
          description: 'Zaraz zostaniesz przekierowany do strony z linkiem',
          borderColor: 'border-emerald-600 bg-emerald-950/30',
          textColor: 'text-emerald-300',
          descriptionColor: 'text-emerald-400/80',
          progressColor: 'bg-emerald-950/30 [&>[data-slot=progress-indicator]]:bg-emerald-500',
          statusText: 'Gotowe!'
        };
      case UploadProgressState.CANCELLING:
        return {
          icon: <XCircle className="w-6 h-6 text-amber-400" />,
          title: 'Anulowanie przesyłania...',
          description: 'Przerywanie procesu i czyszczenie danych...',
          borderColor: 'border-amber-600 bg-amber-950/30',
          textColor: 'text-amber-300',
          descriptionColor: 'text-amber-400/80',
          progressColor: 'bg-amber-950/30 [&>[data-slot=progress-indicator]]:bg-amber-500',
          statusText: 'Anulowanie...'
        };
      case UploadProgressState.PREPARING:
        return {
          icon: <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />,
          title: 'Przygotowywanie plików...',
          description: `Przygotowywanie ${files.length} ${files.length === 1 ? 'pliku' : 'plików'} do wysłania`,
          borderColor: 'border-zinc-800 bg-zinc-950/30',
          textColor: 'text-zinc-200',
          descriptionColor: 'text-zinc-400',
          progressColor: 'bg-zinc-800/30 [&>[data-slot=progress-indicator]]:bg-zinc-400',
          statusText: 'Przygotowywanie...'
        };
      case UploadProgressState.PROCESSING:
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          title: 'Przetwarzanie...',
          description: 'Finalizowanie przesyłania, proszę czekać...',
          borderColor: 'border-emerald-600 bg-emerald-950/30',
          textColor: 'text-emerald-300',
          descriptionColor: 'text-emerald-400/80',
          progressColor: 'bg-emerald-950/30 [&>[data-slot=progress-indicator]]:bg-emerald-500',
          statusText: 'Przetwarzanie...'
        };
      default: // UPLOADING
        return {
          icon: <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />,
          title: 'Wysyłanie plików',
          description: `Wysyłanie... • ${files.length} ${files.length === 1 ? 'plik' : 'plików'}`,
          borderColor: 'border-zinc-800 bg-zinc-950/30',
          textColor: 'text-zinc-200',
          descriptionColor: 'text-zinc-400',
          progressColor: 'bg-zinc-800/30 [&>[data-slot=progress-indicator]]:bg-zinc-400',
          statusText: `${progressPercentage}%`
        };
    }
  }, [progressState, files.length, progressPercentage]);

  return (
    <div className="inset-0 backdrop-blur-sm container mx-auto w-full md:max-w-md max-w-sm flex flex-col items-center justify-center space-y-8 p-6 z-50 transition-opacity duration-300 animate-fade-in-01-text">
      {/* Header Section */}
      <div className="text-center space-y-4 animate-fade-in-01-text">
        <div className="flex items-center justify-center">
          <div className={`w-15 h-15 border border-dashed rounded-full backdrop-blur-sm flex items-center justify-center transition-colors duration-300 ${stateConfig.borderColor}`}>
            {stateConfig.icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className={`text-xl font-medium tracking-tight transition-colors duration-300 ${stateConfig.textColor}`}>
            {stateConfig.title}
          </h2>
          <p className={`text-sm transition-colors duration-300 animate-fade-in-01-text ${stateConfig.descriptionColor}`}>
            {stateConfig.description}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="w-full max-w-sm space-y-4 tracking-tight animate-fade-in-01-text">
        <Progress 
          value={progressPercentage} 
          className={`h-2 transition-colors duration-300 ${stateConfig.progressColor}`}
        />
        
        <div className="flex justify-between items-center text-sm text-zinc-400 animate-fade-in-01-text transition-colors duration-300">
          <div className="flex flex-col items-start space-y-1">
            <span className="animate-fade-in-01-text tracking-tight transition-colors duration-300">
              {formatBytes(uploadedBytes)} / {formatBytes(totalSize)}
            </span>
            {uploadSpeed && progressState === UploadProgressState.UPLOADING && (
              <span className="text-xs text-zinc-500">
                {formatUploadSpeed(uploadSpeed)}
              </span>
            )}
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <span className="animate-fade-in-01-text tracking-tight transition-colors duration-300">
              {stateConfig.statusText}
            </span>
            {estimatedTimeRemaining && progressState === UploadProgressState.UPLOADING && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeRemaining(estimatedTimeRemaining)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="w-full max-w-sm space-y-3">
        <div className={`border border-dashed rounded-lg backdrop-blur-sm p-3 transition-colors duration-300 ${
          progressState === UploadProgressState.CANCELLING
            ? 'border-amber-800 bg-amber-950/10' 
            : 'border-zinc-800 bg-zinc-950/20'
        }`}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed border-zinc-800">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium tracking-tight text-zinc-300">
              {progressState === UploadProgressState.CANCELLING ? 'Anulowane pliki:' : 'Wysyłane pliki:'}
            </span>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className={`flex items-center justify-between py-1 px-2 rounded border border-dashed transition-colors duration-300 ${
                progressState === UploadProgressState.CANCELLING
                  ? 'bg-amber-800/10 border-amber-800/30' 
                  : 'bg-zinc-800/20 border-zinc-800/50'
              }`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                    progressState === UploadProgressState.CANCELLING
                      ? 'bg-amber-500' 
                      : 'bg-zinc-400 animate-pulse'
                  }`} />
                  <span className="text-xs text-zinc-300 truncate">{file.name}</span>
                </div>
                <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warning/Status Message */}
      <div className="w-full max-w-sm">
        {progressState === UploadProgressState.CANCELLING ? (
          <div className="flex items-start gap-3 p-4 border border-dashed border-amber-800/50 bg-amber-950/10 backdrop-blur-sm rounded-lg">
            <Loader2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-200 tracking-tight">Anulowanie w toku</p>
              <p className="text-xs text-amber-300/80 tracking-tight">
                Przerywamy przesyłanie i czyścimy dane. To może potrwać chwilę...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 border border-dashed border-amber-800/50 bg-amber-950/10 backdrop-blur-sm rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-200 tracking-tight">Nie zamykaj tej strony!</p>
              <p className="text-sm text-amber-300/80 tracking-tight">
                Zamknięcie karty lub przeglądarki przerwie wysyłanie plików. 
                Proces może potrwać kilka minut w zależności od rozmiaru plików.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Button - hide during routing */}
      {progressState !== UploadProgressState.ROUTING && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelUpload}
          disabled={progressState === UploadProgressState.CANCELLING}
          className={`transition-all duration-200 flex items-center gap-2 border border-dashed backdrop-blur-sm ${
            progressState === UploadProgressState.CANCELLING
              ? 'text-amber-300 border-amber-800 bg-amber-950/20 cursor-not-allowed opacity-50'
              : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 border-zinc-800 bg-zinc-950/20'
          }`}
        >
          {progressState === UploadProgressState.CANCELLING ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Anulowanie...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Anuluj wysyłanie
            </>
          )}
        </Button>
      )}
    </div>
  );
});

UploadProgressView.displayName = 'UploadProgressView';