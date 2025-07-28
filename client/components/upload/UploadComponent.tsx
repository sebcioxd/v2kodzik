"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from "@/components/ui/file-upload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Turnstile } from "@/components/turnstile";
import { useInfo } from "@/app/hooks/use-fetch";
import { 
  Upload, X, ShieldPlus, Loader2, Rss, Lock, 
  Megaphone, EyeOff, Clock, Link as LinkIcon, XCircle,
  AlertTriangle, CheckCircle2, FileText
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useUpload } from "./hooks/useUpload";
import { useFileValidation } from "./hooks/useFileValidation";
import { useSafariDetection } from "./hooks/useSafariDetection";
import { uploadFormSchema, UploadFormData } from "./upload.types";
import { formatBytes, getMaxSizeText } from "./upload.utils";

const ProgressBar = memo(({ progress }: { progress: number }) => (
  <div className="h-2 w-full bg-zinc-800/30 rounded-full overflow-hidden border border-dashed border-zinc-800/50">
    <div
      className="h-full bg-zinc-400 transition-transform duration-300 ease-out rounded-full"
      style={{
        transform: `translateX(${progress - 100}%)`,
        width: '100%',
        backgroundColor: progress === 100 ? "#10B981" : undefined,
      }}
    />
  </div>
));
ProgressBar.displayName = 'ProgressBar';

const UploadProgressView = memo(({ 
  files, 
  progressPercentage, 
  totalSize, 
  cancelUpload,
  isCancelling,
  isRouting 
}: { 
  files: File[], 
  progressPercentage: number, 
  totalSize: number,
  cancelUpload: () => void,
  isCancelling?: boolean,
  isRouting?: boolean
}) => {
  return (
    <div className="inset-0 backdrop-blur-sm container mx-auto w-full md:max-w-md max-w-sm flex flex-col items-center justify-center space-y-8 p-6 z-50 transition-opacity duration-300 animate-fade-in-01-text">
      <div className="text-center space-y-4 animate-fade-in-01-text">
        <div className="flex items-center justify-center">
          <div className={`w-15 h-15 border border-dashed rounded-full backdrop-blur-sm flex items-center justify-center transition-colors duration-300 ${
            isRouting 
              ? 'border-emerald-600 bg-emerald-950/30'
              : isCancelling 
                ? 'border-amber-600 bg-amber-950/30' 
                : 'border-zinc-800 bg-zinc-950/30'
          }`}>
            {isRouting ? (
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            ) : isCancelling ? (
              <XCircle className="w-6 h-6 text-amber-400" />
            ) : (
              <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className={`text-xl font-medium tracking-tight transition-colors duration-300 ${
            isRouting ? 'text-emerald-300' :
            isCancelling ? 'text-amber-300' : 'text-zinc-200'
          }`}>
            {isRouting ? 'Przekierowywanie...' :
             isCancelling ? 'Anulowanie przesyłania...' :
             progressPercentage === 0 ? 'Przygotowywanie plików...' : 
             progressPercentage === 100 ? 'Przetwarzanie...' : 
             'Wysyłanie plików'}
          </h2>
          <p className={`text-sm transition-colors duration-300 ${
            isRouting ? 'text-emerald-400/80' :
            isCancelling ? 'text-amber-400/80' : 'text-zinc-400'
          }`}>
            {isRouting ? 'Zaraz zostaniesz przekierowany do strony z linkiem' :
             isCancelling ? 'Przerywanie procesu i czyszczenie danych...' :
             progressPercentage === 0 ? `Przygotowywanie ${files.length} ${files.length === 1 ? 'pliku' : 'plików'} do wysłania` :
             progressPercentage === 100 ? 'Finalizowanie przesyłania, proszę czekać...' :
             `Postęp: ${progressPercentage}% • ${files.length} ${files.length === 1 ? 'plik' : 'plików'}`}
          </p>
        </div>
      </div>

      {/* Progress bar - update colors for routing state */}
      <div className="w-full max-w-sm space-y-4 tracking-tight animate-fade-in-01-text">
        <div className="space-y-2">
          <div className={`h-2 w-full rounded-full overflow-hidden border border-dashed transition-colors duration-300 ${
            isRouting 
              ? 'bg-emerald-950/30 border-emerald-800/50'
              : isCancelling 
                ? 'bg-amber-950/30 border-amber-800/50' 
                : 'bg-zinc-800/30 border-zinc-800/50'
          }`}>
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                isRouting 
                  ? 'bg-emerald-500'
                  : isCancelling 
                    ? 'bg-amber-500' 
                    : progressPercentage === 100 
                      ? 'bg-emerald-500' 
                      : 'bg-zinc-400'
              }`}
              style={{
                transform: `translateX(${progressPercentage - 100}%)`,
                width: '100%',
              }}
            />
          </div>
          <div className="flex justify-between items-center text-sm text-zinc-400">
            <span>{formatBytes(totalSize)} całkowity rozmiar</span>
            <span>{isRouting ? 'Gotowe!' : isCancelling ? 'Anulowanie...' : `${progressPercentage}%`}</span>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="w-full max-w-sm space-y-3">
        <div className={`border border-dashed rounded-lg backdrop-blur-sm p-3 transition-colors duration-300 ${
          isCancelling 
            ? 'border-amber-800 bg-amber-950/10' 
            : 'border-zinc-800 bg-zinc-950/20'
        }`}>
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed border-zinc-800">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium tracking-tight text-zinc-300">
              {isCancelling ? 'Anulowane pliki:' : 'Wysyłane pliki:'}
            </span>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className={`flex items-center justify-between py-1 px-2 rounded border border-dashed transition-colors duration-300 ${
                isCancelling 
                  ? 'bg-amber-800/10 border-amber-800/30' 
                  : 'bg-zinc-800/20 border-zinc-800/50'
              }`}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                    isCancelling 
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
        {isCancelling ? (
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
              <p className="text-xs text-amber-300/80 tracking-tight">
                Zamknięcie karty lub przeglądarki przerwie wysyłanie plików. 
                Proces może potrwać kilka minut w zależności od rozmiaru plików.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Button - hide during routing */}
      {!isRouting && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelUpload}
          disabled={isCancelling}
          className={`transition-all duration-200 flex items-center gap-2 border border-dashed backdrop-blur-sm ${
            isCancelling
              ? 'text-amber-300 border-amber-800 bg-amber-950/20 cursor-not-allowed opacity-50'
              : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 border-zinc-800 bg-zinc-950/20 '
          }`}
        >
          {isCancelling ? (
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

export function UploadPage() {
  const { data: session } = useSession();
  const { data: info } = useInfo();
  const router = useRouter();
  const [totalSize, setTotalSize] = useState(0);
  
  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      slug: "",
      isPrivate: false,
      visibility: true,
      accessCode: "",
      time: "24",
      files: [], 
    },
  });
  
  const selectedTime = form.watch("time");
  const { validateFile, onFileReject, maxSize } = useFileValidation(selectedTime);
  const { 
    uploadState, 
    uploadMutation, 
    cancelUpload, 
    turnstileRef, 
    turnstileToken, 
    setTurnstileToken 
  } = useUpload();
  const { showSafariDialog, handleSafariProceed } = useSafariDetection(info?.userAgent);


  const handleFileChange = useCallback((files: File[]) => {
    if (uploadState.isUploading) return;

    const validFiles = files.filter(file => {
      const validationResult = validateFile(file);
      if (validationResult) {
        onFileReject(file, validationResult);
        return false;
      }
      return true;
    });

    const newTotalSize = validFiles.reduce((acc, file) => acc + file.size, 0);
    setTotalSize(newTotalSize);
    
    return validFiles;
  }, [uploadState.isUploading, validateFile, onFileReject]);

  const handleTimeChange = useCallback((newTime: string) => {
    const currentFiles = form.getValues("files");
    const currentTotalSize = currentFiles.reduce((acc, file) => acc + file.size, 0);
    const newMaxSize = newTime === "0.5" ? 100 * 1024 * 1024 : 40 * 1024 * 1024;
    
    if (currentTotalSize > newMaxSize) {
      toast.error(
        `Nie można zmienić czasu - całkowity rozmiar plików (${formatBytes(currentTotalSize)}) ` +
        `przekracza limit ${formatBytes(newMaxSize)} dla wybranego czasu.`
      );
      return false;
    }
    
    return true;
  }, [form]);

  const onSubmit = (data: UploadFormData) => {
    // Store current files before upload starts
    setUploadingFiles(data.files || []);
    
    uploadMutation.mutate(data, {
      onSuccess: () => {
        // Reset uploading files after successful upload
        setTimeout(() => {
          setUploadingFiles([]);
        }, 1000);
      },
      onError: () => {
        // Reset uploading files on error
        setUploadingFiles([]);
      }
    });
  };

  const progressPercentage = uploadState.progress;
  const isUploading = uploadState.isUploading;
  const isCancelling = uploadState.isCancelling;
  const isRouting = uploadState.isRouting;
  
  // Store files data when upload starts to prevent undefined access
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  
  useEffect(() => {
    if (isUploading && form.getValues("files")?.length > 0) {
      setUploadingFiles(form.getValues("files"));
    }
  }, [isUploading, form]);

  // If uploading, show only the progress view with smooth transition
  if (isUploading || isRouting) {
    const files = uploadingFiles.length > 0 ? uploadingFiles : form.getValues("files") || [];
    return (
      <>
       
        <UploadProgressView 
          files={files}
          progressPercentage={progressPercentage}
          totalSize={totalSize}
          cancelUpload={cancelUpload}
          isCancelling={isCancelling}
          isRouting={isRouting}
        />
      </>
    );
  }

  return (
    <div className="transition-opacity duration-300">
      {/* Safari Warning Dialog */}
      <Dialog open={showSafariDialog}>
        <DialogContent className="border border-dashed border-zinc-800 bg-zinc-950/70 backdrop-blur-sm text-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-200 tracking-tight">
              Wykryliśmy, że korzystasz z przeglądrki Safari.
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Przeglądarka ta nie jest wspierana. Safari notorycznie zwraca błędy podczas przesyłania plików. 
              Prosimy o użycie innej przeglądarki.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-start border-t border-dashed border-zinc-800 pt-4">
            <DialogClose asChild onClick={() => router.push("/")}>
              <Button 
                variant="outline"
                className="bg-zinc-950/20 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Wróć do strony głównej
              </Button>
            </DialogClose>
            <DialogClose asChild onClick={handleSafariProceed}>
              <Button 
                variant="outline"
                className="bg-zinc-950/20 text-red-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
              >
                Nie korzystam z przeglądarki Safari
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload Section */}
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200 animate-fade-in-01-text border-dashed tracking-tight border-zinc-800 border-b pb-3 mb-2">
                  <Upload className="w-4 h-4" /> Pliki do wysłania:
                </FormLabel>
                <FormControl>
                  <FileUpload
                    maxFiles={20}
                    maxSize={maxSize}
                    maxTotalSize={maxSize}
                    className="w-full md:min-w-sm max-w-md animate-fade-in-01-text tracking-tight"
                    value={field.value}
                    onValueChange={(files) => {
                      const validFiles = handleFileChange(files);
                      field.onChange(validFiles);
                    }}
                    onFileValidate={validateFile}
                    onFileReject={onFileReject}
                    multiple
                  >
                    <FileUploadDropzone className="border-dashed border-zinc-800 hover:bg-zinc-950/30">
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex items-center justify-center rounded-full border border-dashed border-zinc-800 p-2">
                          <Upload className="size-6 text-zinc-400" />
                        </div>
                        <p className="font-medium text-md text-zinc-200">
                          Przeciągnij i upuść pliki tutaj
                        </p>
                        <p className="text-zinc-400 text-md">
                          Lub kliknij aby przeglądać do <span className="text-zinc-200 ">{getMaxSizeText(selectedTime)}</span> oraz 20 plików
                        </p>
                      </div>
                    </FileUploadDropzone>
                    
                    <FileUploadList>
                      {field.value?.map((file, index) => (
                        <FileUploadItem
                          key={index} 
                          value={file}
                          className="border-dashed py-2 border-zinc-800"
                        >
                          <FileUploadItemPreview className="bg-darken rounded-md text-zinc-300 border-zinc-950" />
                          <FileUploadItemMetadata className="text-zinc-400" />
                          <FileUploadItemDelete asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-zinc-200 hover:bg-darken hover:text-zinc-600"
                            >
                              <X />
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      )) || []}
                    </FileUploadList>

                    {/* File Size Progress */}
                    {field.value?.length > 0 && (
                      <div className="mt-4 space-y-1 animate-fade-in-01-text">
                        <div className="flex justify-between items-center text-md text-zinc-400">
                          <span>Całkowity rozmiar</span>
                          <span>{formatBytes(totalSize)} / {getMaxSizeText(selectedTime)}</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-400 transition-all duration-300 ease-out transform origin-left rounded-full"
                            style={{
                              width: `${Math.min((totalSize / maxSize) * 100, 100)}%`,
                              backgroundColor: totalSize > maxSize ? "#ef4444" : undefined,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </FileUpload>
                </FormControl>
                
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-zinc-400 animate-fade-in-01-text">
                  <span>Chcesz przesłać kod?</span>
                  <Link href="/schowek" className="text-zinc-200 hover:text-zinc-300 flex items-center gap-1">
                    Przejdź do schowka
                    <LinkIcon className="w-3 h-3" />
                  </Link>
                </div>
                <FormMessage className="text-red-400 animate-fade-in-01-text" />
              </FormItem>
            )}
          />

          {/* Custom Slug Section */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-200 animate-fade-in-01-text text-sm pb-1">
                  <LinkIcon className="w-4 h-4" /> Niestandarowy link: 
                  <span className="text-zinc-600 animate-fade-in-01-text ml-[-2]">opcjonalne</span>
                </FormLabel>
                <FormControl>
                  <div className="w-full max-w-md">
                    <div className="flex items-center w-full backdrop-blur-sm border border-dashed border-zinc-800 rounded-sm overflow-hidden group transition-all duration-300 hover:bg-zinc-800/50">
                      <span className="text-zinc-400 px-2 border-r border-dashed border-zinc-800 bg-zinc-950/20 text-sm">
                        dajkodzik.pl/
                      </span>
                      <Input
                        {...field}
                        placeholder="np. moj-link"
                        className="flex-1 border-0 bg-transparent text-zinc-200 text-sm placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                      />
                    </div>
                  </div>
                </FormControl>
                <p className="text-sm text-zinc-400 mt-1 tracking-tight">
                  Wpisz własną nazwę lub zostaw puste dla auto-generacji.
                </p>
                <FormMessage className="text-red-400 animate-fade-in-01-text" />
              </FormItem>
            )}
          />

      <Button
            type="submit"
            className={`w-full bg-zinc-900 backdrop-blur-sm border border-dashed border-zinc-800 hover:bg-zinc-800 duration-50 text-zinc-300  ${turnstileToken ? "disabled:bg-zinc-800/50" : "bg-zinc-900/20"}`}
            disabled={!turnstileToken}
            size="sm"
          >
            <span className="flex items-center justify-center">
              <Upload className="mr-2 h-4 w-4" />
              Wygeneruj link z plikami
            </span>
          </Button>

          <Turnstile 
            ref={turnstileRef}
            onTokenChange={setTurnstileToken} 
          />

          {/* Additional Settings */}
          <div className="w-full animate-fade-in-01-text">
            <h3 className="text-zinc-200 mb-4 text-sm border-b border-dashed border-zinc-800 pb-2 flex items-center gap-2">
              <ShieldPlus className="w-4 h-4" /> 
              Ustawienia dodatkowe:
            </h3>

            {/* Access Type */}
            <div className="mb-6 border-b border-dashed border-zinc-800">
              <h4 className="text-zinc-300 mb-2 text-sm tracking-tight">Kto może otworzyć link?</h4>
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        value={field.value ? "private" : "public"}
                        onValueChange={(value) => {
                          field.onChange(value === "private");
                          if (value === "public") {
                            form.setValue("accessCode", "");
                          }
                        }}
                        className="w-full animate-slide-in-left"
                      >
                        <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 tracking-tight">
                          <TabsTrigger
                            value="public"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50"
                          >
                            <Rss className="h-4 w-4 mr-2" />
                            Każdy z linkiem
                          </TabsTrigger>
                          <TabsTrigger
                            value="private"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Tylko z hasłem
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="public" className="py-2">
                          <p className="text-sm tracking-tight text-zinc-400 animate-fade-in-01-text">
                            Każdy z linkiem będzie miał dostęp do twoich plików.
                          </p>
                        </TabsContent>
                        <TabsContent value="private" className="pt-2 flex justify-center items-center flex-col">
                          <div className="space-y-4 animate-fade-in-01-text">
                            <FormField
                              control={form.control}
                              name="accessCode"
                              render={({ field }) => (
                                <FormItem className="flex flex-col justify-center items-center">
                                  <FormLabel className="text-zinc-400 mb-2 flex items-center gap-2 text-md tracking-tight">
                                    Podaj kod dostępu
                                  </FormLabel>
                                  <FormControl>
                                    <InputOTP
                                      maxLength={6}
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                    >
                                      <InputOTPGroup>
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t  border-zinc-800 backdrop-blur-sm text-zinc-200"
                                          index={0}
                                        />
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t border-zinc-800 backdrop-blur-sm text-zinc-200"
                                          index={1}
                                        />
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t border-zinc-800 backdrop-blur-sm text-zinc-200"
                                          index={2}
                                        />
                                      </InputOTPGroup>
                                      <InputOTPSeparator className="bg-zinc-950/20 border-zinc-800 backdrop-blur-sm text-zinc-400"/>
                                      <InputOTPGroup>
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t border-zinc-800 backdrop-blur-sm text-zinc-200"
                                          index={3}
                                        />
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t border-zinc-800 backdrop-blur-sm text-zinc-200"
                                          index={4}
                                        />
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t border-zinc-800 backdrop-blur-sm text-zinc-200"
                                          index={5}
                                        />
                                      </InputOTPGroup>
                                    </InputOTP>
                                  </FormControl>
                                  <FormMessage className="text-red-400 animate-fade-in-01-text mt-2" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-sm text-zinc-400 my-2 mb-2 animate-fade-in-01-text">
                            Tylko osoby z kodem dostępu będą mogły otworzyć link.
                          </p>
                        </TabsContent>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Visibility Setting */}
            <div className="mb-6">
              <h4 className="text-zinc-300 mb-2 text-sm font-medium tracking-tight">Czy pokazać link na stronie głównej?</h4>
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        value={field.value ? "visible" : "hidden"}
                        onValueChange={(value) => field.onChange(value === "visible")}
                        className="w-full animate-slide-in-left"
                      >
                        <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 tracking-tight">
                          <TabsTrigger
                            value="visible"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50"
                          >
                            <Megaphone className="h-4 w-4 mr-2" />
                            Tak, pokaż publicznie
                          </TabsTrigger>
                          <TabsTrigger
                            value="hidden"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50"
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Nie, ukryj link
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Expiration Setting */}
            <div className="mb-6">
              <h4 className="text-zinc-300 mb-2 text-sm font-medium tracking-tight">Jak długo link ma być aktywny?</h4>
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        value={field.value}
                        onValueChange={(value) => {
                          if (handleTimeChange(value)) {
                            field.onChange(value);
                          }
                        }}
                        className="w-full animate-slide-in-left"
                      >
                        <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 tracking-tight">
                          <TabsTrigger
                            value="0.5"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50 relative group"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            30 minut
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-zinc-900 text-zinc-200 text-xs py-1 px-2 rounded border border-zinc-800 whitespace-nowrap">
                              Limit plików: 100MB
                            </div>
                          </TabsTrigger>
                          <TabsTrigger
                            value="24"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            24 godziny
                          </TabsTrigger>
                          <TabsTrigger
                            value="168"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200 hover:bg-zinc-800/50 relative group"
                            disabled={!session}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            7 dni
                            {!session && (
                              <>
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-zinc-900 text-zinc-200 text-xs py-1 px-2 rounded border border-zinc-800 whitespace-nowrap">
                                  Zaloguj się, aby wydłużyć czas
                                </div>
                                <Lock className="h-3 w-3 ml-1 inline-block text-zinc-500" />
                              </>
                            )}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </FormControl>
                    <p className="text-zinc-400 text-sm mt-2 animate-fade-in-01-text">
                      {field.value === "0.5" 
                        ? "Limit plików dla 30 minut: 100MB" 
                        : !session 
                          ? "Aby generować linki na dłużej, zaloguj się." 
                          : ""
                      }
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </div>

          
        </form>
      </Form>
    </div>
  );
}