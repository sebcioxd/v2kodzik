import { Hono } from "hono"
import { downloadBulkFilesService, downloadFileService } from "../services/download.service.ts"


const downloadRoute = new Hono()

downloadRoute.get("/:folder/:file", async (c) => {

    const folder = c.req.param("folder")
    const fileName = c.req.param("file")

    const path = `${folder}/${fileName}`

    const file = await downloadFileService({
        path,
        c
    })

    c.header('Content-Type', 'application/octet-stream')
    c.header('Content-Disposition', `attachment; filename="${path}"`)

    return file
    
   
})

downloadRoute.post("/bulk", async (c) => {
    try {
        const { paths } = await c.req.json()
        
        c.header('Content-Type', 'application/zip');
        c.header('Content-Disposition', `attachment; filename="bulk.zip"`)

        const zipBlob = await downloadBulkFilesService({
            paths,
            c
        })

        return c.body(zipBlob as unknown as ReadableStream<Uint8Array>)
    } catch (err) {
        return c.json({
            message: "Server error has occured",
            error: err,
        }, 500)
    }
})

export default downloadRoute