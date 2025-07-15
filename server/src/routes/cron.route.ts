import { Hono } from "hono";
import { deleteExpireFilesService } from "../services/cron.service";

const cronRoute = new Hono();

cronRoute.post("/", async (c) => {
    const result = await deleteExpireFilesService({ c });
    return c.json({
        message: "Cron wykonany pomyślnie",
        result,
    });
});

export default cronRoute;
