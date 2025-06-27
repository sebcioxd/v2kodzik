import { Hono } from "hono";

import helloRoute from "./hello.route.js";
import infoRoute from "./info.route.js";
import uploadRoute from "./upload.route.js";
import lastpostsRoute from "./lastposts.route.js";
import statusRoute from "./status.route.js";
import historyRoute from "./history.route.js";
import downloadRoute from "./download.route.js";
import shareRoute from "./share.route.js";
import cronRoute from "./cron.route.js";
import updateRoute from "./update.route.js";
const routes = new Hono()

routes.route("/", helloRoute)
routes.route("/info", infoRoute)
routes.route("/upload", uploadRoute)
routes.route("/last-posts", lastpostsRoute)
routes.route("/status", statusRoute)
routes.route("/history", historyRoute)
routes.route("/download", downloadRoute)
routes.route("/share", shareRoute)
routes.route("/cron", cronRoute)
routes.route("/update", updateRoute)

export default routes