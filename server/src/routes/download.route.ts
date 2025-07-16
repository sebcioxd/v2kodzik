import { Hono } from "hono"
import { DownloadService } from "../services/download.service"
import { createRateLimiter } from "../services/rate-limit.service"

const downloadRoute = new Hono()
const downloadService = new DownloadService("sharesbucket")

downloadRoute.get("/:folder/:file", createRateLimiter("download"), async (c) => {
    const folder = c.req.param("folder")
    const fileName = c.req.param("file")
    const path = `${folder}/${fileName}`

    return await downloadService.downloadFile({
        path,
        c
    })
})

downloadRoute.post("/bulk", createRateLimiter("download"), async (c) => {
    try {
        const { paths } = await c.req.json()
        return await downloadService.downloadBulkFiles({ paths, c })
    } catch (err) {
        return c.json({
            message: "Wystąpił błąd podczas pobierania plików",
            error: err,
        }, 500)
    }
})

export default downloadRoute