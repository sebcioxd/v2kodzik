import type { Env } from "hono";
import type { Context } from "hono";
import { auth } from "../lib/auth.js";


export type EmailType = "verify" | "forget";

export type EmailServiceProps = {
    to: string;
    subject: string;
    text: string;
    emailType: EmailType;
}

export type InfoServiceResponse = {
    remoteAdress: string;
    remoteAdress_v6: string;
    userAgent: string;
    referer: string;
    nodeVersion: string;
    port: number;
    transport: string;
    host: string;
}

export type RateLimiterServiceResult = {
    remainingPoints: number;
    msBeforeNext: number;
    consumedPoints: number;
    isFirstInDuration: boolean;
}

export type S3UploadServiceProps = {
    Key: string;
    Body: string | Uint8Array<ArrayBufferLike> | ReadableStream<Uint8Array<ArrayBufferLike>>;
}

export type UploadRequestProps = {
    slug: string;
    isPrivate: string;
    accessCode: string;
    visibility: string;
    time: string;
}

export type GetUserHistoryServiceProps = {
    offset: number;
    limit: number;
    userId: string;
}

export type GetUserHistoryCountServiceProps = {
    userId: string;
}

export type GetShareFileServiceProps = {
    slug: string;
    c: Context;
}

export type VerifyShareCodeServiceProps = {
    code: string;
    slug: string;
    c: Context;
}

export type VerifyCookieServiceProps = {
    slug: string;
    c: Context;
}

export type DownloadFileServiceProps = {
    path: string;
    c: Context;
}

export type DownloadBulkFilesServiceProps = {
    paths: string[];
    c: Context;
}

export type DeleteExpireFilesServiceProps = {
    c: Context;
}

export type DeleteExpireFilesServiceBody = {
    key: string;
}

export type SendWebhookServiceProps = {
    content: string;
}

export const Session = auth.$Infer.Session
export const User = auth.$Infer.Session.user

export interface AuthSession extends Env {
    Variables: {
        session: typeof Session | null
        user: typeof User | null
    }
}