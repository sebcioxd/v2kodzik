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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Upload, X, Terminal } from "lucide-react";
import * as React from "react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import axios from "axios";




const formSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, { message: "Proszę wybrać przynajmniej jeden plik" }),
  slug: z.string().trim()
    .min(4, { message: "Nazwa linku musi mieć przynajmniej 4 znaki" })
    .refine((value) => {
      const restrictedPaths = ['/upload', '/search', '/faq', '/api', '/admin'];
      return !restrictedPaths.some(path => 
        value.toLowerCase().trim() === path.replace('/', '').trim() || 
        value.toLowerCase().trim().startsWith(path.replace('/', '').trim())
      );
    }, { message: "Ta nazwa jest zarezerwowana dla systemu" })
    .optional()
    .or(z.literal('')),
});

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
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
      slug: "",
    },
  });

  const onFileReject = React.useCallback((file: File, message: string) => {
    console.log(message);
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      data.files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("slug", data.slug || "");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/upload`, 
        formData, 
        {
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          }
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
      console.error("Error uploading files:", error);
      setError(true);
      setSuccess(false);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || "Failed to upload files");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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
                  maxSize={10 * 1024 * 1024}
                  maxTotalSize={10 * 1024 * 1024}
                  className="w-full max-w-md animate-fade-in-01-text" 
                  value={field.value}
                  onValueChange={(files) => {
                    field.onChange(files);
                    const newTotalSize = files.reduce((acc, file) => acc + file.size, 0);
                    setTotalSize(newTotalSize);
                  }}
                  onFileReject={onFileReject}
                  multiple
                >
                  <FileUploadDropzone className="border-dashed border-zinc-800 hover:bg-zinc-950/30">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="flex items-center justify-center rounded-full border border-dashed border-zinc-800 p-2.5">
                        <Upload className="size-6 text-zinc-400" />
                      </div>
                      <p className="font-medium text-sm text-zinc-200">Przeciągnij i upuść pliki tutaj</p>
                      <p className="text-zinc-400 text-xs">
                        Lub kliknij aby przeglądać (maksymalnie 20 plików, 10MB maksymalnie)
                      </p>
                    </div>
                    <FileUploadTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2 w-fit text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/30 border-zinc-800 bg-zinc-950/20">
                        Przeglądaj pliki
                      </Button>
                    </FileUploadTrigger>
                  </FileUploadDropzone>
                  <FileUploadList >
                    {field.value.map((file, index) => (
                      <FileUploadItem key={index} value={file} className="border-dashed border-zinc-800">
                        <FileUploadItemPreview className="bg-zinc-800/50 rounded-md text-zinc-300 border-zinc-950 "/>
                        <FileUploadItemMetadata  className="text-zinc-400"/>
                        <FileUploadItemDelete asChild>
                          <Button variant="ghost" size="icon" className="size-7 text-zinc-200 hover:bg-darken hover:text-zinc-700">
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
                        <span>{formatBytes(totalSize)} / 10 MB</span>
                      </div>
                      <div className="h-1 w-full bg-zinc-800/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-zinc-400 transition-all duration-300 ease-out transform origin-left rounded-full"
                          style={{ 
                            width: `${Math.min((totalSize / (10 * 1024 * 1024)) * 100, 100)}%`,
                            backgroundColor: totalSize > (10 * 1024 * 1024) ? '#ef4444' : undefined
                          }}
                        />
                      </div>
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
            <FormLabel className="text-zinc-400 animate-fade-in-01-text">Wprowadz nazwę linku</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 animate-fade-in-01-text bg-zinc-950/20 border-zinc-800 rounded-md px-1 py-1">dajkodzik.pl/</span>
                  <Input
                    {...field}
                    placeholder="Zostaw puste aby automatycznie wygenerować..."
                  className="w-full max-w-md bg-zinc-950/20 border-zinc-800 text-zinc-200 placeholder:text-zinc-400 animate-fade-in-01-text"
                />
                </div>
              </FormControl>
              <FormMessage className="text-red-400 animate-fade-in-01-text" />
            </FormItem>
          )}
        />
              
        

        <Button
          type="submit"
          className={`w-full bg-zinc-900 backdrop-blur-sm hover:bg-zinc-800 duration-50 text-zinc-400 animate-slide-in-left ${isSubmitting ? "bg-zinc-900/20" : ""}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              {uploadProgress === 100 
                ? 'Przetwarzanie plików...' 
                : `Wysyłanie... ${uploadProgress}%`
              }
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
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1 text-center">
              {uploadProgress === 100 
                ? 'Przetwarzanie plików...' 
                : `${uploadProgress}% ukończono`
              }
            </p>
          </div>
        )}

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
    <section className="mt-4 flex justify-start items-start w-full max-w-md animate-slide-in-left">
      <Alert className="bg-zinc-950/10 border-zinc-800 border-dashed text-zinc-400">
      <Terminal className="h-4 w-4 " />
      <AlertTitle className="text-sm">Wskazówka</AlertTitle>
      <AlertDescription className="text-[0.7rem]">
        Linki są dostępne przez 24 godziny.
      </AlertDescription>
    </Alert>
    </section>
    </>
  );
}