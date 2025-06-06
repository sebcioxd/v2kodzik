import { Hono } from "hono";
import { deleteExpireFilesService } from "../services/cron.service.ts";
const cronRoute = new Hono();
cronRoute.post("/", async (c) => {
    const result = await deleteExpireFilesService({ c });
    return c.json({
        message: "Cron job executed successfully",
        result,
    });
});
export default cronRoute;
