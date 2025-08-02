import axios from "axios";
import { PresignResponse, UploadFormData, UploadProgress } from "./upload.types";


export async function getPresignedUrls(
  data: UploadFormData,
  turnstileToken: string
): Promise<PresignResponse> {
  const fileNames = data.files.map(file => file.name).join(',');
  const contentTypes = data.files.map(file => file.type).join(',');
  const fileSizes = data.files.map(file => file.size); // Add file sizes
 
  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/upload/presign?` + 
    `slug=${data.slug}&` +
    `fileNames=${fileNames}&` +
    `contentTypes=${contentTypes}&` +
    `isPrivate=${data.isPrivate}&` +
    `accessCode=${data.accessCode}&` +
    `visibility=${data.visibility}&` +
    `time=${data.time}`,
    { 
      token: turnstileToken,
      fileSizes: fileSizes // Send file sizes in request body
    },
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
  time: number,
  finalize_signature: string,
  cancel_signature: string
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
      time,
      signature: finalize_signature,
      cancel_signature: cancel_signature
    },
    { withCredentials: true }
  );
}

export async function cancelUpload(
  slug: string,
  cancel_signature: string
): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/v1/upload/cancel/${slug}`, { cancel_signature, }, { withCredentials: true });
}

