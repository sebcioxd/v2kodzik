import { Hono } from "hono";

import helloRoute from "./hello.route";
import infoRoute from "./info.route";
import uploadRoute from "./upload.route";
import lastpostsRoute from "./lastposts.route";
import statusRoute from "./status.route";
import historyRoute from "./history.route";
import downloadRoute from "./download.route";
import shareRoute from "./share.route";
import cronRoute from "./cron.route";
import updateRoute from "./update.route";
import snippetRoute from "./snippets.route";
import oauthRoute from "./oauth.route";
import limitsRoute from "./limits.route";

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
routes.route("/snippet", snippetRoute)
routes.route("/oauth", oauthRoute)
routes.route("/limits", limitsRoute)

export default routes