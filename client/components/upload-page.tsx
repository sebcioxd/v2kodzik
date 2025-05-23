"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Upload, X, Terminal, AlertCircle, Loader2, Rss, Lock, Megaphone, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from "@/components/ui/input-otp";

const formSchema = z
  .object({
    files: z
      .array(z.instanceof(File))
      .min(1, { message: "Proszę wybrać przynajmniej jeden plik" }),
    slug: z
      .string()
      .trim()
      .min(4, { message: "Nazwa linku musi mieć przynajmniej 4 znaki" })
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
          const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%]/;
          return !invalidChars.test(value);
        },
        {
          message:
            "Link nie może zawierać nawiasów, polskich znaków ani znaku procenta",
        }
      )
      .optional()
      .or(z.literal("")),
    isPrivate: z.boolean(),
    visibility: z.boolean(),
    accessCode: z
      .string()
      .refine(
        (val) =>
          !val ||
          val.length === 4 ||
          val.length === 0 ||
          val.length === undefined,
        { message: "Kod dostępu musi zawierać 4 znaki" }
      )
      .optional(),
  })
  .refine(
    (data) => {
      // If isPrivate is true, accessCode must be provided and have exactly 4 characters
      return (
        !data.isPrivate || (data.accessCode && data.accessCode.length === 4)
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

export function UploadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
      slug: "",
      isPrivate: false,
      visibility: true,
      accessCode: "",
    },
  });
  const cancelTokenSource = React.useRef<any>(null);
  const lastLoaded = React.useRef<number>(0);
  const lastTime = React.useRef<number>(0);
  const progressUpdateThrottle = React.useRef<NodeJS.Timeout | null>(null);
  const [rejectedFiles, setRejectedFiles] = useState<
    { name: string; message: string }[]
  >([]);

  const onFileValidate = React.useCallback((file: File): string | null => {
    // Check for invalid characters in filename (including spaces)
    const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%\s]/;
    if (invalidChars.test(file.name)) {
      return "Nazwa pliku nie może zawierać spacji, nawiasów, polskich znaków ani znaku procenta";
    }

    // Validate file size (max 40MB)
    const MAX_SIZE = 40 * 1024 * 1024; // 40MB
    if (file.size > MAX_SIZE) {
      return `Plik musi być mniejszy niż ${MAX_SIZE / (1024 * 1024)}MB`;
    }

    return null;
  }, []);

  const onFileReject = React.useCallback((file: File, message: string) => {
    setRejectedFiles((prev) => [...prev, { name: file.name, message }]);
    // Remove the rejection message after 5 seconds
    setTimeout(() => {
      setRejectedFiles((prev) => prev.filter((f) => f.name !== file.name));
    }, 5000);
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadSpeed(null);
    setEstimatedTime(null);
    lastLoaded.current = 0;
    lastTime.current = Date.now();

    // Create a new cancel token source
    cancelTokenSource.current = axios.CancelToken.source();

    try {
      const formData = new FormData();
      data.files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("slug", data.slug || "");
      formData.append("isPrivate", data.isPrivate.toString());
      if (data.isPrivate && data.accessCode) {
        formData.append("accessCode", data.accessCode);
      }
      formData.append("visibility", data.visibility.toString());

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/upload`,
        formData,
        {
          withCredentials: true,
          cancelToken: cancelTokenSource.current.token,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              // Throttle UI updates to every 100ms
              if (progressUpdateThrottle.current) {
                clearTimeout(progressUpdateThrottle.current);
              }

              progressUpdateThrottle.current = setTimeout(() => {
                const now = Date.now();
                const loaded = progressEvent.loaded;
                const total = progressEvent.total;

                // Calculate percentage
                const percentCompleted = Math.round(
                  (loaded * 100) / (total || 1)
                );

                // Calculate upload speed (bytes per second)
                if (lastTime.current && lastLoaded.current) {
                  const timeDiff = now - lastTime.current;
                  if (timeDiff > 0) {
                    const byteDiff = loaded - lastLoaded.current;
                    const speedMBps =
                      ((byteDiff / timeDiff) * 1000) / (1024 * 1024);
                    setUploadSpeed(speedMBps);

                    // Calculate ETA in seconds
                    const remainingBytes = (total || 1) - loaded;
                    const etaSeconds =
                      remainingBytes / ((byteDiff / timeDiff) * 1000);
                    setEstimatedTime(etaSeconds);
                  }
                }

                // Update references for next calculation
                lastLoaded.current = loaded;
                lastTime.current = now;

                setUploadProgress(percentCompleted);
              }, 20);
            }
          },
        }
      );

      if (response.status === 200) {
        setSuccess(true);
        setError(false);
        form.reset();
        router.push(`/success?slug=${response.data.slug}`);
      } else {
        setError(true);
        setSuccess(false);
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      // Check if error is from a cancelled request
      if (axios.isCancel(error)) {
        setErrorMessage("Upload was canceled");
      } else {
        console.error("Error uploading files:", error);
        setError(true);
        setSuccess(false);
        if (axios.isAxiosError(error) && error.response) {
          setErrorMessage(
            error.response.data.message || "Failed to upload files"
          );
        } else {
          setErrorMessage("An unexpected error occurred");
        }
      }
    } finally {
      if (progressUpdateThrottle.current) {
        clearTimeout(progressUpdateThrottle.current);
      }
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadSpeed(null);
      setEstimatedTime(null);
      cancelTokenSource.current = null;
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FileUpload
                    maxFiles={20}
                    maxSize={40 * 1024 * 1024}
                    maxTotalSize={40 * 1024 * 1024}
                    className="w-full max-w-md animate-fade-in-01-text"
                    value={field.value}
                    onValueChange={(files) => {
                      if (!isSubmitting) {
                        field.onChange(files);
                        const newTotalSize = files.reduce(
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
                        <p className="font-medium text-sm text-zinc-200">
                          Przeciągnij i upuść pliki tutaj
                        </p>
                        <p className="text-zinc-400 text-xs">
                          Lub kliknij aby przeglądać do 40 MB
                        </p>
                      </div>
                      <FileUploadTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
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
                        <div className="flex justify-between items-center text-xs text-zinc-400">
                          <span>Całkowity rozmiar</span>
                          <span>{formatBytes(totalSize)} / 40 MB</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-400 transition-all duration-300 ease-out transform origin-left rounded-full"
                            style={{
                              width: `${Math.min(
                                (totalSize / (40 * 1024 * 1024)) * 100,
                                100
                              )}%`,
                              backgroundColor:
                                totalSize > 40 * 1024 * 1024
                                  ? "#ef4444"
                                  : undefined,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {rejectedFiles.length > 0 && (
                      <div className="mt-2 animate-fade-in-01-text ">
                        {rejectedFiles.map((file, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-xs text-red-400 mb-1 cursor-pointer flex items-center gap-1">
                                  <AlertCircle className="size-4" />
                                  <span className="border-b border-dotted border-red-400/50">
                                    {file.name}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs"
                              >
                                <p>{file.message}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    )}
                  </FileUpload>
                </FormControl>
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
                  className={`text-zinc-400 animate-fade-in-01-text ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  Wprowadz nazwę linku
                </FormLabel>
                <FormControl>
                  <div
                    className={`flex items-center gap-2 ${
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
                  className={`text-xs text-zinc-400 mt-1 ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  Wpisz własną nazwę lub zostaw puste dla auto-generacji.
                </p>
                <FormMessage className="text-red-400 animate-fade-in-01-text" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className={`w-full bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 duration-50 text-zinc-400 animate-slide-in-left ${
              isSubmitting ? "bg-zinc-900/20" : ""
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                {uploadProgress === 100
                  ? "Przetwarzanie plików..."
                  : `Wysyłanie... ${uploadProgress}%`}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Upload className="mr-2 h-4 w-4" />
                Wygeneruj link z plikami
              </span>
            )}
          </Button>

          {isSubmitting && uploadProgress > 0 && (
            <div className="w-full animate-fade-in-01-text">
              <div className="h-1 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 transition-all duration-500 ease-out transform origin-left rounded-full"
                  style={{
                    width: `${uploadProgress}%`,
                    backgroundColor:
                      uploadProgress === 100 ? "#10B981" : undefined,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <p className="flex items-center">
                  {uploadProgress === 100 ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-zinc-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Przetwarzanie plików...
                    </>
                  ) : (
                    `${uploadProgress}% ukończono`
                  )}
                </p>
                {uploadSpeed !== null && uploadProgress < 100 && (
                  <p>{uploadSpeed.toFixed(1)} MB/s</p>
                )}
                {estimatedTime !== null && uploadProgress < 100 && (
                  <p>
                    {estimatedTime > 60
                      ? `~ ${Math.floor(estimatedTime / 60)}m ${Math.round(
                          estimatedTime % 60
                        )}s pozostało`
                      : `~ ${
                          estimatedTime < 1
                            ? `${estimatedTime.toFixed(1)}s pozostało`
                            : `${Math.round(estimatedTime)}s pozostało`
                        }`}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="w-full animate-fade-in-01-text">
            <h3 className="text-zinc-200 mb-2 text-sm font-medium">Dodatkowa konfiguracja</h3>
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
                          <Rss className="h-4 w-4" />
                          Publiczny
                        </TabsTrigger>
                        <TabsTrigger
                          value="private"
                          className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                  transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                  hover:bg-zinc-800/50"
                          disabled={isSubmitting}
                        >
                          <Lock className="h-4 w-4" />
                          Prywatny
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="public" className="py-2">
                        <p className="text-xs text-zinc-400 animate-fade-in-01-text">
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
                                <FormLabel className="text-zinc-400 mb-2 flex items-center gap-2">
                                   Podaj kod dostępu
                                  
                                </FormLabel>
                                <FormControl>
                                  <InputOTP
                                    maxLength={4}
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    disabled={isSubmitting}
                                  >
                                    <InputOTPGroup>
                                      <InputOTPSlot
                                        className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200"
                                        index={0}
                                      />
                                      <InputOTPSlot
                                        className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200"
                                        index={1}
                                      />
                                      </InputOTPGroup>
                                      <InputOTPSeparator className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-400"/>
                                      <InputOTPGroup>
                                      <InputOTPSlot
                                        className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200"
                                        index={2}
                                      />
                                      <InputOTPSlot
                                        className="bg-zinc-950/20 border-dashed border-zinc-800 backdrop-blur-sm text-zinc-200"
                                        index={3}
                                      />
                                    </InputOTPGroup>
                                  </InputOTP>
                                </FormControl>
                               
                                <FormMessage className="text-red-400 animate-fade-in-01-text mt-2" />
                              </FormItem>
                            )}
                          />
                        </div>
                        <p className="text-xs text-zinc-400 my-1 mb-2 animate-fade-in-01-text">
                          Tylko osoby z kodem dostępu będą mogły otworzyć link.
                        </p>
                      </TabsContent>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

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
                          <Megaphone className="h-4 w-4" />
                          Widoczny
                        </TabsTrigger>
                        <TabsTrigger
                          value="hidden"
                          className="w-full bg-zinc-950/20 border border-dashed border-zinc-800 backdrop-blur-sm p-3 text-zinc-400 
                                  transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-200
                                  hover:bg-zinc-800/50"
                          disabled={isSubmitting}
                        >
                          <EyeOff className="h-4 w-4" />
                          Ukryty
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="visible" className="pt-1">
                        <p className="text-xs text-zinc-400 animate-fade-in-01-text">
                          Link będzie widoczny na stronie głównej.
                        </p>
                      </TabsContent>
                      <TabsContent value="hidden" className="pt-1">
                        <p className="text-xs text-zinc-400 animate-fade-in-01-text">
                          Link będzie ukryty na stronie głównej.
                        </p>
                      </TabsContent>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {error && (
            <div className="p-2  border border-dashed border-red-800 text-red-300 text-center rounded-md text-sm animate-fade-in-01-text max-w-md">
              {errorMessage}
            </div>
          )}

          {success && (
            <div className="p-2  border border-dashed border-green-800 text-green-300 text-center rounded-md text-sm animate-fade-in-01-text max-w-md">
              pliki wysłane pomyślnie.
            </div>
          )}
        </form>
      </Form>
      
    </>
  );
}
