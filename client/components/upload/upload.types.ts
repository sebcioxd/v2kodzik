import { z } from "zod";

export const uploadFormSchema = z
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
            "/upload", "/search", "/faq", "/api", "/admin", 
            "/auth", "/panel", "/success", "/schowek",
          ];
          return !restrictedPaths.some(
            (path) =>
              value.toLowerCase().trim() === path.replace("/", "").trim() ||
              value.toLowerCase().trim().startsWith(path.replace("/", "").trim())
          );
        },
        { message: "Ta nazwa jest zarezerwowana dla systemu" }
      )
      .refine(
        (value) => {
          const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%/]/;
          return !invalidChars.test(value);
        },
        { message: "Link nie może zawierać niedozwolonych znaków" }
      )
      .optional()
      .or(z.literal("")),
    isPrivate: z.boolean(),
    visibility: z.boolean(),
    time: z.enum(["0.5", "24", "168"]),
    accessCode: z
      .string()
      .refine(
        (val) => !val || val.length === 6 || val.length === 0,
        { message: "Kod dostępu musi zawierać 6 znaków" }
      )
      .optional(),
  })
  .refine(
    (data) => !data.isPrivate || (data.accessCode && data.accessCode.length === 6),
    {
      message: "Kod dostępu jest wymagany dla plików prywatnych",
      path: ["accessCode"],
    }
  );

export type UploadFormData = z.infer<typeof uploadFormSchema>;

export interface PresignedData {
  url: string;
  key: string;
}

export interface PresignResponse {
  presignedData: PresignedData[];
  slug: string;
  time: string;
}

export interface UploadProgress {
  fileIndex: number;
  loaded: number;
  total: number;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  cancelTokenSource: any | null;
}

export interface FileValidationError {
  name: string;
  message: string;
}

