import axios from "axios";
import { PresignResponse, UploadFormData, UploadProgress } from "./upload.types";


export async function getPresignedUrls(
  data: UploadFormData,
  turnstileToken: string
): Promise<PresignResponse> {
  const fileNames = data.files.map(file => file.name).join(',');
  const contentTypes = data.files.map(file => file.type).join(',');
 
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/upload/presign?` + 
    `slug=${data.slug}&` +
    `fileNames=${fileNames}&` +
    `contentTypes=${contentTypes}&` +
    `isPrivate=${data.isPrivate}&` +
    `accessCode=${data.accessCode}&` +
    `visibility=${data.visibility}&` +
    `time=${data.time}`,
    { token: turnstileToken },
    { withCredentials: true }
  );

  return response.data;
}


export async function uploadFileToS3(
  file: File,
  presignedUrl: string,
  cancelToken: any,
  onProgress: (progress: UploadProgress) => void,
fileIndex: number
): Promise<void> {
  await axios.put(presignedUrl, file, {
    withCredentials: false,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    cancelToken,
    headers: {
      'Content-Type': file.type
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        onProgress({
          fileIndex,
          loaded: progressEvent.loaded,
          total: progressEvent.total,
        });
      }
    },
  });
}

export async function finalizeUpload(
  slug: string,
  files: File[],
  data: UploadFormData,
  time: string
): Promise<void> {
  await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/upload/finalize`,
    {
      slug,
      files: files.map(file => ({
        fileName: file.name,
        size: file.size,
        contentType: file.type,
        lastModified: file.lastModified,
      })),
      isPrivate: data.isPrivate,
      visibility: data.visibility,
      accessCode: data.accessCode,
      time
    },
    { withCredentials: true }
  );
}