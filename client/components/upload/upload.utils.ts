import axios from "axios";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { useState, useEffect } from "react";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb > 1) {
    return `${gb.toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
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

export function sanitizeFileName(filename: string): string {
  // Remove or replace invalid characters
  let sanitized = filename
    // Replace Polish characters with their ASCII equivalents
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/Ą/g, 'A')
    .replace(/Ć/g, 'C')
    .replace(/Ę/g, 'E')
    .replace(/Ł/g, 'L')
    .replace(/Ń/g, 'N')
    .replace(/Ó/g, 'O')
    .replace(/Ś/g, 'S')
    .replace(/Ź/g, 'Z')
    .replace(/Ż/g, 'Z')
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove parentheses and percent signs
    .replace(/[()%]/g, '')
    // Remove any remaining special characters except dots, hyphens, and underscores
    .replace(/[^a-zA-Z0-9._-]/g, '')
    // Remove multiple consecutive dots, underscores, or hyphens
    .replace(/\.{2,}/g, '.')
    .replace(/_{2,}/g, '_')
    .replace(/-{2,}/g, '-')
    // Remove leading/trailing dots, underscores, or hyphens
    .replace(/^[._-]+|[._-]+$/g, '');

  // Ensure the filename is not empty and has a reasonable length
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'file';
  }

  // Limit filename length to prevent issues
  if (sanitized.length > 100) {
    const extension = sanitized.includes('.') ? sanitized.substring(sanitized.lastIndexOf('.')) : '';
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 100 - extension.length) + extension;
  }

  return sanitized;
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
