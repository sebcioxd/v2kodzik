import { cors } from "hono/cors"
import { SITE_URL } from "../lib/env"

const configCors = cors({
    origin: SITE_URL,
    allowHeaders: ["Content-Type", "Authorization", "user-agent", "x-real-user-agent"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
});
  
export default configCors;