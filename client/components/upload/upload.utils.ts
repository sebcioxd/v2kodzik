import axios from "axios";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function isSafariBrowser(userAgent: string): boolean {
  return /^((?!chrome|android).)*Safari/i.test(userAgent);
}

export function getMaxSize(time: string): number {
  return time === "0.5" ? 100 * 1024 * 1024 : 40 * 1024 * 1024;
}

export function getMaxSizeText(time: string): string {
  // Remove the time-based logic and use subscription-based limits
  return "50MB"; // This will be overridden by the actual limit from useFileValidation
}

export function validateFileName(filename: string): string | null {
  const invalidChars = /[\(\)ąćęłńóśźżĄĆĘŁŃÓŚŹŻ%\s]/;
  if (invalidChars.test(filename)) {
    return "Nazwa pliku nie może zawierać spacji, nawiasów, polskich znaków ani znaku procenta";
  }
  return null;
}

export function validateFileSize(file: File, maxSize: number): string | null {
  if (file.size > maxSize) {
    return `Plik musi być mniejszy niż ${maxSize / (1024 * 1024)}MB`;
  }
  return null;
}

export function validateTotalSize(files: File[], maxSize: number): string | null {
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  if (totalSize > maxSize) {
    return `Całkowity rozmiar plików (${formatBytes(totalSize)}) przekracza limit ${formatBytes(maxSize)}`;
  }
  return null;
}

export function createCancelToken() {
  return axios.CancelToken.source();
}