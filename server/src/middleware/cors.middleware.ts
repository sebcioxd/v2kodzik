import { cors } from "hono/cors"
import { SITE_URL } from "../lib/env.js"

const configCors = cors({
    origin: SITE_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
});
  
export default configCors;