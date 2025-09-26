"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { useRouter } from "nextjs-toploader/app";
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
  Upload, X, ShieldPlus, Rss, Lock, 
  Megaphone, EyeOff, Clock, Link as LinkIcon, Crown, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useUpload } from "./hooks/useUpload";
import { useFileValidation } from "./hooks/useFileValidation";
import { useSafariDetection } from "./hooks/useSafariDetection";
import { uploadFormSchema, UploadFormData } from "./upload.types";
import { formatBytes } from "./upload.utils";
import { Progress } from "@/components/ui/progress";
import { UploadProgressView } from "./ProgressComponent";

// Custom component for file items with inline notifications
const FileItemWithNotification = memo(({ 
  file, 
  index, 
  filenameChanges, 
  clearFilenameChange 
}: {
  file: File;
  index: number;
  filenameChanges: Map<string, string>;
  clearFilenameChange: (originalName: string) => void;
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const originalName = Array.from(filenameChanges.keys()).find(key => 
    filenameChanges.get(key) === file.name
  );

  useEffect(() => {
    if (originalName) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        // Clear the change record after animation completes
        setTimeout(() => clearFilenameChange(originalName), 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [originalName, clearFilenameChange]);

  return (
    <div className="space-y-1">
      <FileUploadItem
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
      
      {/* Inline filename change notification */}
      {originalName && (
        <div className={`ml-2 px-2 py-1 bg-emerald-950/30 border border-emerald-800/50 rounded text-xs text-emerald-300 animate-fade-in-01-text ${
          showNotification 
            ? 'opacity-100 translate-y-0 max-h-8' 
            : 'opacity-0 -translate-y-1 max-h-0 overflow-hidden'
        }`}>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Zmieniono z "{originalName}"</span>
          </div>
        </div>
      )}
    </div>
  );
});

FileItemWithNotification.displayName = 'FileItemWithNotification';

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
  const { 
    validateFile, 
    onFileReject, 
    maxSize, 
    activeSubscription, 
    isLoadingSubscriptions, 
    sanitizeFile,
    filenameChanges,
    clearFilenameChange
  } = useFileValidation(selectedTime);
  
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

    const sanitizedFiles = files.map(file => sanitizeFile(file));
    const validFiles = sanitizedFiles.filter(file => {
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
  }, [uploadState.isUploading, validateFile, onFileReject, sanitizeFile]);

  const handleTimeChange = useCallback((newTime: string) => {
    const currentFiles = form.getValues("files");
    const currentTotalSize = currentFiles.reduce((acc, file) => acc + file.size, 0);
    
    // Use the subscription-based maxSize instead of time-based
    if (currentTotalSize > maxSize) {
      toast.error(
        `Nie można zmienić czasu - całkowity rozmiar plików (${formatBytes(currentTotalSize)}) ` +
        `przekracza limit ${formatBytes(maxSize)}.`
      );
      return false;
    }
    
    return true;
  }, [form, maxSize]);

  const onSubmit = (data: UploadFormData) => {
    setUploadingFiles(data.files || []);
    
    uploadMutation.mutate(data, {
      onSuccess: () => {
        setUploadingFiles([])
      },
      onError: () => {
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
                          Lub kliknij aby przeglądać do <span className="text-zinc-200 ">{formatBytes(maxSize)}</span> oraz 20 plików
                        </p>
                      </div>
                    </FileUploadDropzone>
                    
                    <FileUploadList>
                      {field.value?.map((file, index) => {
                        const originalName = Array.from(filenameChanges.keys()).find(key => 
                          filenameChanges.get(key) === file.name
                        );
                        
                        return (
                          <div key={index} className="space-y-1">
                            <FileUploadItem
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
                            
                            {/* Inline filename change notification */}
                            {originalName && (
                              <div className=" px-2 py-1 bg-zinc-950/30 border border-dashed border-zinc-800 text-white rounded text-xs  animate-fade-in-01-text">
                                <div className="flex items-center gap-1">
                                  
                                  <span>Automatycznie zmieniono nazwę pliku ze względu na kompatybilność.</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }) || []}
                    </FileUploadList>

                    {/* File Size Progress */}
                    {field.value?.length > 0 && (
                      <div className="mt-4 space-y-1 animate-fade-in-01-text">
                        <div className="flex justify-between items-center text-md text-zinc-400">
                          <span>Całkowity rozmiar</span>
                          <span className="animate-fade-in-01-text tracking-tight transition-colors duration-300">{formatBytes(totalSize)} / {formatBytes(maxSize)}</span>
                        </div>
                        <Progress 
                          value={Math.min((totalSize / maxSize) * 100, 100)}
                          className={`h-1 transition-colors duration-300 ${
                            totalSize > maxSize 
                              ? 'bg-zinc-800/30 [&>[data-slot=progress-indicator]]:bg-red-500'
                              : 'bg-zinc-800/30 [&>[data-slot=progress-indicator]]:bg-zinc-400'
                          }`}
                        />
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
                              Limit plików: {formatBytes(maxSize)}
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
                      
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Subscription Info */}
            {session?.user && (
              <div className="mb-6 p-4 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-lg">
                <h4 className="text-zinc-300 mb-2 text-sm font-medium tracking-tight flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Limit plików
                </h4>
                {isLoadingSubscriptions ? (
                  <p className="text-zinc-400 text-sm">Ładowanie informacji o subskrypcji...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-sm">
                      {activeSubscription 
                        ? `Plan ${activeSubscription.plan}: Maksymalny rozmiar pliku ${formatBytes(maxSize)}`
                        : "Plan darmowy: Maksymalny rozmiar pliku 50MB"
                      }
                    </p>
                    {!activeSubscription && (
                      <Link href="/pricing" className="text-blue-400 hover:text-blue-300 text-sm">
                        Rozważ upgrade, aby zwiększyć limit →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          
        </form>
      </Form>
    </div>
  );
}