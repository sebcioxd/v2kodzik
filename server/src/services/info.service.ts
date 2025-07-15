import type { InfoServiceResponse } from "../lib/types";
import type { Context } from "hono";
import { getConnInfo } from 'hono/bun'

export function getInfoService(c: Context): InfoServiceResponse {

    const info = getConnInfo(c)

    const response: InfoServiceResponse = {
        remoteAdress: c.req.header("CF-Connecting-IP") || "127.0.0.1", // lub x-forwarded-for
        host: c.req.header("host") || "",
        remoteAdress_v6: info.remote.address || "",
        port: info.remote.port || 0,
        transport: info.remote.transport || "",
        userAgent: c.req.header("user-agent") || "",
        referer: c.req.header("referer") || "",
        nodeVersion: process.version,
    }

    return response;
}