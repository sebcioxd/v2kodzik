import { Hono } from "hono";
import { getInfoService } from "../services/info.service.js";

const infoRoute = new Hono();

infoRoute.get("/", (c) => {
    const info = getInfoService(c);
    return c.json(info);
});

export default infoRoute;