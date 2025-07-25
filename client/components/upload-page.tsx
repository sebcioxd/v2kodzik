"use client";

import { useState, useRef } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
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
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Upload, X, ShieldPlus , AlertCircle, Loader2, Rss, Lock, Megaphone, EyeOff, Clock, Link as LinkIcon, XCircle } from "lucide-react";
import * as React from "react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp";
import Link from "next/link";
import { toast } from "sonner";
import { Turnstile, TurnstileRef } from "@/components/turnstile";
import { useInfo } from "@/app/hooks/use-fetch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "./ui/label";

const formSchema = z
  .object({
    files: z
      .array(z.instanceof(File))
      .min(1, { message: "Proszę wybrać przynajmniej jeden plik" }),
    slug: z
      .string()
      .trim()
      .min(4, { message: "Nazwa linku musi mieć przynajmniej 4 znaki" })
      .max(16, { message: "Nazwa linku może mieć maksymalnie 16 znaków" })
      .refine(
        (value) => {
          const restrictedPaths = [
            "/upload",
            "/search",
            "/faq",
            "/api",
            "/admin",
            "/auth",
            "/panel",
            "/success",
            "/schowek",
          ];
          return !restrictedPaths.some(
            (path) =>
              value.toLowerCase().trim() === path.replace("/", "").trim() ||
              value
                .toLowerCase()
                .trim()
                .startsWith(path.replace("/", "").trim())
          );
        },
        { message: "Ta nazwa jest zarezerwowana dla systemu" }
      )
      .refine(
        (value) => {
          // Check for parentheses, Polish characters, and percentage signs
          const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%/]/;
          return !invalidChars.test(value);
        },
        {
          message:
            "Link nie może zawierać niedozwolonych znaków",
        }
      )
      .optional()
      .or(z.literal("")),
    isPrivate: z.boolean(),
    visibility: z.boolean(),
    time: z.string(),
    accessCode: z
      .string()
      .refine(
        (val) =>
          !val ||
          val.length === 6 ||
          val.length === 0 ||
          val.length === undefined,
        { message: "Kod dostępu musi zawierać 6 znaków" }
      )
      .optional(),
  })
  .refine(
    (data) => {
      // If isPrivate is true, accessCode must be provided and have exactly 4 characters
      return (
        !data.isPrivate || (data.accessCode && data.accessCode.length === 6)
      );
    },
    {
      message: "Kod dostępu jest wymagany dla plików prywatnych",
      path: ["accessCode"],
    }
  );

type FormData = z.infer<typeof formSchema>;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function isSafariBrowser(userAgent: string) {
  const isSafariTest = /^((?!chrome|android).)*Safari/i.test(userAgent);
  return isSafariTest;
}



export function UploadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [rejectedFiles, setRejectedFiles] = useState<{ name: string; message: string }[]>([]);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [cancelTokenSource, setCancelTokenSource] = useState<any>(null);
  const turnstileRef = useRef<TurnstileRef>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [isSafari, setIsSafari] = useState(true);

  const { data: info } = useInfo();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
      slug: "",
      isPrivate: false,
      visibility: true,
      accessCode: "",
      time: "24",
    },
  });
  
  function handleProceed() {
    setIsSafari(false);
    localStorage.setItem("safari_accepted", "true");
  }

  const selectedTime = form.watch("time");

  const onFileValidate = React.useCallback((file: File): string | null => {
    // Check for invalid characters in filename (including spaces)
    const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%\s]/;
    if (invalidChars.test(file.name)) {
      return "Nazwa pliku nie może zawierać spacji, nawiasów, polskich znaków ani znaku procenta";
    }

    const MAX_SIZE = selectedTime === "0.5" ? 100 * 1024 * 1024 : 40 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      return `Plik musi być mniejszy niż ${MAX_SIZE / (1024 * 1024)}MB`;
    }

    return null;
  }, [selectedTime]);

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast.error(`${file.name}: ${message}`);
  }, []);

  const handleCancel = async () => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel('Upload cancelled by user');
      setIsSubmitting(false);
      setUploadProgress(0);
      setError(true);
    }
  };

  const handleUpload = async (data: FormData) => {
    if (!turnstileToken) {
      toast.error("Proszę ukończyć captche.");
      return;
    }


    // Create a new cancel token source
    const source = axios.CancelToken.source();
    setCancelTokenSource(source);

    // Add validation check at the start of upload
    const MAX_SIZE = data.time === "0.5" ? 100 * 1024 * 1024 : 40 * 1024 * 1024;
    const totalSize = data.files.reduce((acc, file) => acc + file.size, 0);
    
    if (totalSize > MAX_SIZE) {
      setError(true);
      toast.error(`Całkowity rozmiar plików (${formatBytes(totalSize)}) przekracza limit ${formatBytes(MAX_SIZE)} dla wybranego czasu.`);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const totalBytes = data.files.reduce((acc, file) => acc + file.size, 0);
      // Create a map to track progress for each file
      const fileProgress = new Map();
      data.files.forEach((_, index) => fileProgress.set(index, 0));

      // Step 1: Get presigned URLs and create share record
      const fileNames = data.files.map(file => file.name).join(',');
      const contentTypes = data.files.map(file => file.type).join(',');
      
      const presignResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/upload/presign?` + 
        `slug=${data.slug}&` +
        `fileNames=${fileNames}&` +
        `contentTypes=${contentTypes}&` +
        `isPrivate=${data.isPrivate}&` +
        `accessCode=${data.accessCode}&` +
        `visibility=${data.visibility}&` +
        `time=${data.time}`,
        { token: turnstileToken },
        {
          withCredentials: true,
        }
      );

      if (presignResponse.data.presignedData) {
        const { presignedData, slug, time } = presignResponse.data;

        // Step 2: Upload files to S3 with cancel token
        const uploadPromises = data.files.map(async (file, index) => {
          const presignedInfo = presignedData[index];
          
          return axios.put(presignedInfo.url, file, {
            withCredentials: false,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            cancelToken: source.token,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                fileProgress.set(index, progressEvent.loaded);
                const totalUploaded = Array.from(fileProgress.values()).reduce((sum, value) => sum + value, 0);
                const totalProgress = Math.min(Math.round((totalUploaded / totalBytes) * 100), 100);
                setUploadProgress(totalProgress);
              }
            },
          });
        });

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

        // Step 3: Finalize the upload
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/upload/finalize`,
          {
            slug,
            files: data.files.map(file => ({
              fileName: file.name,
              size: file.size
            })),
            isPrivate: data.isPrivate,
            visibility: data.visibility,
            accessCode: data.accessCode,
            time
          },
          {
            withCredentials: true,
          }
        );

        setSuccess(true);
        setError(false);
        form.reset();
        router.push(`/success?slug=${slug}&time=${time}&type=upload`);
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken(null);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Upload cancelled:', error.message);
      } else {
        console.error("Error uploading files:", error);
        setError(true);
        setSuccess(false);
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response?.status === 429 
            ? "Przekroczono limit żądań. Odczekaj chwilę i spróbuj ponownie." 
            : error.response.data.message || "Wystąpił błąd podczas przesyłania plików"
          );
        } else {
          toast.error("Wystąpił błąd podczas przesyłania plików");
        }
      }
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken(null);
    } finally {
      setCancelTokenSource(null);
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const getMaxSizeText = () => {
    return selectedTime === "0.5" ? "100 MB" : "40 MB";
  };

  const getMaxSize = () => {
    return selectedTime === "0.5" ? 100 * 1024 * 1024 : 40 * 1024 * 1024;
  };

  React.useEffect(() => {
    const currentFiles = form.getValues("files");
    if (currentFiles.length > 0) {
      const validFiles = currentFiles.filter(file => {
        const validationResult = onFileValidate(file);
        if (validationResult) {
          onFileReject(file, validationResult);
          return false;
        }
        return true;
      });
      
      form.setValue("files", validFiles);
      const newTotalSize = validFiles.reduce(
        (acc, file) => acc + file.size,
        0
      );
      setTotalSize(newTotalSize);
    }
  }, [selectedTime, onFileValidate, onFileReject, form]);

  return (
    <>

{info?.userAgent && !localStorage.getItem("safari_accepted") && isSafariBrowser(info?.userAgent) && (
  <Dialog open={isSafari}>
    <DialogContent className="border border-dashed border-zinc-800 bg-zinc-950/70 backdrop-blur-sm text-zinc-200 ">
      <DialogHeader>
        <DialogTitle className="text-zinc-200 tracking-tight">
          Wykryliśmy, że korzystasz z przeglądrki Safari.
        </DialogTitle>
        <DialogDescription className="text-zinc-400">
          Przeglądarka ta nie jest wspierana. Safari notorycznie zwraca błędy podczas przesyłania plików. Prosimy o użycie innej przeglądarki.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="justify-start border-t border-dashed border-zinc-800 pt-4">
        <DialogClose asChild onClick={() => router.push("/")}>
          <Button 
            type="button" 
            variant="outline"
            className="bg-zinc-950/20 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            Wróć do strony głównej
          </Button>
        </DialogClose>
        <DialogClose asChild onClick={handleProceed}>
          <Button 
            type="button" 
            variant="outline"
            className="bg-zinc-950/20 text-red-400 border-zinc-800  hover:bg-zinc-800 hover:text-zinc-200"
          >
            Przejdź do przesyłania
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
    
      <Form {...form}>
        
        <form onSubmit={form.handleSubmit(handleUpload)} className="space-y-6 ">
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={`text-zinc-200 animate-fade-in-01-text border-dashed  border-zinc-700 border-b pb-3 mb-2 ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  <Upload className="w-4 h-4" /> Pliki do wysłania:
                </FormLabel>
                <FormControl>
                  <FileUpload
                    maxFiles={20}
                    maxSize={getMaxSize()}
                    maxTotalSize={getMaxSize()}
                    className="w-full md:min-w-md max-w-md animate-fade-in-01-text tracking-tight"
                    value={field.value}
                    onValueChange={(files) => {
                      if (!isSubmitting) {
                        const validFiles = files.filter(file => {
                          const validationResult = onFileValidate(file);
                          if (validationResult) {
                            onFileReject(file, validationResult);
                            return false;
                          }
                          return true;
                        });
                        
                        field.onChange(validFiles);
                        const newTotalSize = validFiles.reduce(
                          (acc, file) => acc + file.size,
                          0
                        );
                        setTotalSize(newTotalSize);
                      }
                    }}
                    onFileValidate={onFileValidate}
                    onFileReject={onFileReject}
                    multiple
                    disabled={isSubmitting}
                  >
                    <FileUploadDropzone
                      className={`border-dashed border-zinc-800 hover:bg-zinc-950/30 ${
                        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 text-center">
                        <div className="flex items-center justify-center rounded-full border border-dashed border-zinc-800 p-2.5">
                          <Upload className="size-6 text-zinc-400" />
                        </div>
                        <p className="font-medium text-md text-zinc-200">
                          Przeciągnij i upuść pliki tutaj
                        </p>
                        <p className="text-zinc-400 text-md">
                          Lub kliknij aby przeglądać do {getMaxSizeText()} oraz 20 plików
                        </p>
                      </div>
                      <FileUploadTrigger asChild>
                        <Button
                          variant="outline"
                          size="lg"
                          className="mt-2 w-fit text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/30 border-zinc-800 bg-zinc-950/20"
                        >
                          Przeglądaj pliki
                        </Button>
                      </FileUploadTrigger>
                    </FileUploadDropzone>
                    <FileUploadList>
                      {field.value.map((file, index) => (
                        <FileUploadItem
                          key={index}
                          value={file}
                          className={`border-dashed border-zinc-800 ${
                            isSubmitting ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <FileUploadItemPreview className="bg-zinc-800/50 rounded-md text-zinc-300 border-zinc-950" />
                          <FileUploadItemMetadata className="text-zinc-400" />
                          <FileUploadItemDelete asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-zinc-200 hover:bg-darken hover:text-zinc-700"
                              disabled={isSubmitting}
                            >
                              <X />
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      ))}
                    </FileUploadList>
                    {field.value.length > 0 && (
                      <div className="mt-4 space-y-1 animate-fade-in-01-text">
                        <div className="flex justify-between items-center text-md text-zinc-400">
                          <span>Całkowity rozmiar</span>
                          <span>{formatBytes(totalSize)} / {getMaxSizeText()}</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-400 transition-all duration-300 ease-out transform origin-left rounded-full"
                            style={{
                              width: `${Math.min(
                                (totalSize / getMaxSize()) * 100,
                                100
                              )}%`,
                              backgroundColor:
                                totalSize > getMaxSize()
                                  ? "#ef4444"
                                  : undefined,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </FileUpload>
                </FormControl>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-zinc-400 animate-fade-in-01-text">
                  <span>Chcesz przesłać kod?</span>
                  <Link 
                    href="/schowek" 
                    className="text-zinc-200 hover:text-zinc-300 flex items-center gap-1"
                  >
                    Przejdź do schowka
                    <LinkIcon className="w-3 h-3" />
                  </Link>
                </div>
                <FormMessage className="text-red-400 animate-fade-in-01-text" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  className={`text-zinc-200 animate-fade-in-01-text text-sm  border-dashed border-zinc-700 border-b pb-3 ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  <LinkIcon className="w-4 h-4" /> Niestandarowy link: (opcjonalnie)
                </FormLabel>
                <FormControl>
                  <div
                    className={`flex items-center gap-2 py-2 ${
                      isSubmitting ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-zinc-400 animate-fade-in-01-text bg-zinc-950/20 border-zinc-800 rounded-md px-1 py-1">
                      dajkodzik.pl/
                    </span>
                    <Input
                      {...field}
                      disabled={isSubmitting}
                      placeholder="np. moj-link"
                      
                      className={`w-full max-w-md bg-zinc-950/20 border-zinc-800 text-zinc-200 placeholder:text-zinc-400 animate-fade-in-01-text ${
                        isSubmitting ? "cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </FormControl>
                <p
                  className={`text-md text-zinc-400 mt-1 ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  Wpisz własną nazwę lub zostaw puste dla auto-generacji.
                </p>
                <FormMessage className="text-red-400 animate-fade-in-01-text" />
              </FormItem>
            )}
          />

          <Turnstile 
            ref={turnstileRef}
            onTokenChange={setTurnstileToken} 
          />

          <Button
            type="submit"
            className={`w-full bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 duration-50 text-zinc-400 animate-slide-in-left ${
              isSubmitting ? "bg-zinc-900/20" : ""
            }`}
            disabled={isSubmitting || !turnstileToken}
            size="sm"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                {uploadProgress === 0 ? (
                  `Przygotowywanie ${form.getValues("files").length} ${form.getValues("files").length === 1 ? 'pliku' : 'plików'}...`
                ) : uploadProgress === 100 ? (
                  "Przetwarzanie plików..."
                ) : (
                  `Wysyłanie... ${uploadProgress}%`
                )}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Upload className="mr-2 h-4 w-4" />
                Wygeneruj link z plikami
              </span>
            )}
          </Button>

          {isSubmitting && (
            <div className="w-full space-y-2 animate-fade-in-01-text flex items-center justify-center flex-col">
              <div className="h-1 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 transition-all duration-300 ease-out transform origin-left rounded-full"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor: uploadProgress === 100 ? "#10B981" : undefined,
                  }}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className=" text-zinc-400 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Anuluj wysyłanie
              </Button>
            </div>
          )}

          <div className="w-full animate-fade-in-01-text">
            <h3 className="text-zinc-200 mb-4 text-md border-b border-dashed border-zinc-800 pb-2 flex items-center gap-2">
              <ShieldPlus className="w-4 h-4" /> 
              Ustawienia dodatkowe:
            </h3>

            {/* Access Type Setting */}
            <div className="mb-6 border-b border-dashed border-zinc-800">
              <h4 className="text-zinc-300 mb-2 text-sm font-medium">Kto może otworzyć link?</h4>
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        defaultValue="public"
                        onValueChange={(value) => {
                          field.onChange(value === "private");
                          if (value === "public") {
                            form.setValue("accessCode", "");
                          }
                        }}
                        value={field.value ? "private" : "public"}
                        className="w-full animate-slide-in-left"
                      >
                        <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 relative">
                          <TabsTrigger
                            value="public"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50"
                            disabled={isSubmitting}
                          >
                            <Rss className="h-4 w-4 mr-2" />
                            Każdy z linkiem
                          </TabsTrigger>
                          <TabsTrigger
                            value="private"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50"
                            disabled={isSubmitting}
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Tylko z hasłem
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="public" className="py-2">
                          <p className="text-md text-zinc-400 animate-fade-in-01-text">
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
                                  <FormLabel className="text-zinc-400 mb-2 flex items-center gap-2 text-md">
                                     Podaj kod dostępu
                                    
                                  </FormLabel>
                                  <FormControl>
                                    <InputOTP
                                      maxLength={6}
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      disabled={isSubmitting}
                                    >
                                      <InputOTPGroup>
                                        <InputOTPSlot
                                          className="bg-zinc-950/20 border-b border-t border-zinc-800 backdrop-blur-sm text-zinc-200"
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
            <div className="mb-6 ">
              <h4 className="text-zinc-300 mb-2 text-sm font-medium">Czy pokazać link na stronie głównej?</h4>
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        defaultValue="visible"
                        onValueChange={(value) => {
                          field.onChange(value === "visible");
                        }}
                        value={field.value ? "visible" : "hidden"}
                        className="w-full animate-slide-in-left"
                      >
                        <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 relative">
                          <TabsTrigger
                            value="visible"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50"
                            disabled={isSubmitting}
                          >
                            <Megaphone className="h-4 w-4 mr-2" />
                            Tak, pokaż publicznie
                          </TabsTrigger>
                          <TabsTrigger
                            value="hidden"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50"
                            disabled={isSubmitting}
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
              <h4 className="text-zinc-300 mb-2 text-sm font-medium">Jak długo link ma być aktywny?</h4>
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Tabs
                        defaultValue="24"
                        onValueChange={(value) => {
                          const newTime = value === "24" ? "24" : value === "0.5" ? "0.5" : "168";
                          const MAX_SIZE = newTime === "0.5" ? 100 * 1024 * 1024 : 40 * 1024 * 1024;
                          const currentFiles = form.getValues("files");
                          const totalSize = currentFiles.reduce((acc, file) => acc + file.size, 0);
                          
                          if (totalSize > MAX_SIZE) {
                            form.setValue("time", field.value);
                            toast.error(`Nie można zmienić czasu - całkowity rozmiar plików (${formatBytes(totalSize)}) przekracza limit ${formatBytes(MAX_SIZE)} dla wybranego czasu.`);
                            return;
                          }
                          
                          setError(false);
                          field.onChange(newTime);
                        }}
                        value={field.value}
                        className="w-full animate-slide-in-left"
                      >
                        <TabsList className="w-full space-x-2 bg-transparent border-dashed border-zinc-800 relative">
                          <TabsTrigger
                            value="0.5"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50 relative group"
                            disabled={isSubmitting}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            30 minut
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-zinc-900 text-zinc-200 text-xs py-1 px-2 rounded border border-zinc-800 whitespace-nowrap">
                              Limit plików: 100MB
                            </div>
                          </TabsTrigger>
                          <TabsTrigger
                            value="24"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50"
                            disabled={isSubmitting}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            24 godziny
                          </TabsTrigger>
                          <TabsTrigger
                            value="168"
                            className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                    transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                    hover:bg-zinc-800/50 relative group"
                            disabled={isSubmitting || !session}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            7 dni
                            {!session && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-zinc-900 text-zinc-200 text-xs py-1 px-2 rounded border border-zinc-800 whitespace-nowrap">
                                Zaloguj się, aby wydłużyć czas
                              </div>
                            )}
                            {!session && (
                              <Lock className="h-3 w-3 ml-1 inline-block text-zinc-500" />
                            )}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                    </FormControl>
                    <p className="text-zinc-400 text-sm mt-2 animate-fade-in-01-text">
                      {field.value === "0.5" ? "Limit plików dla 30 minut: 100MB" : !session ? "Aby generować linki na dłużej, zaloguj się." : ""}
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
      
    </>
  );
}
