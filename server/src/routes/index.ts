import { Hono } from 'hono'
import uploadRoute from './upload.route'
import shareRoute from './share.route'
import downloadRoute from './download.route'
import statusRoute from './status.route'    
import cronRoute from './cron.route'
import sessionRoute from './session.route'
import usrHistoryRoute from './usr-history.route'
const routes = new Hono()

routes.route("/upload", uploadRoute)
routes.route("/share", shareRoute)
routes.route("/download", downloadRoute)
routes.route("/status", statusRoute)
routes.route("/cron", cronRoute)
routes.route("/session", sessionRoute)
routes.route("/history", usrHistoryRoute)
export default routes;
