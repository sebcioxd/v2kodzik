import { Hono } from "hono"
import { downloadFileService, downloadBulkFilesService } from "../services/download.service.js"
import { rateLimiterService } from "../services/rate-limit.service.js"

const downloadRoute = new Hono()

downloadRoute.get("/:folder/:file", async (c) => {
    try {
        await rateLimiterService({
            keyPrefix: "download",
            identifier: c.req.header("x-forwarded-for") || "127.0.0.1",
        });
    } catch (err) {
        return c.json({
            message: "Rate limit exceeded",
        }, 429)
    }

    const folder = c.req.param("folder")
    const fileName = c.req.param("file")
    const path = `${folder}/${fileName}`

    return await downloadFileService({
        path,
        c
    })
})

downloadRoute.post("/bulk", async (c) => {
    try {
        await rateLimiterService({
            keyPrefix: "download",
            identifier: c.req.header("x-forwarded-for") || "127.0.0.1",
        });
    } catch (err) {
        return c.json({
            message: "Rate limit exceeded",
        }, 429)
    }

    try {
        const { paths } = await c.req.json()
        return await downloadBulkFilesService({ paths, c })
    } catch (err) {
        return c.json({
            message: "Server error has occurred",
            error: err,
        }, 500)
    }
})

export default downloadRoute