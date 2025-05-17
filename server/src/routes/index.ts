import { Hono } from 'hono'
import uploadRoute from './upload.route'
import shareRoute from './share.route'
import downloadRoute from './download.route'
import statusRoute from './status.route'    
import cronRoute from './cron.route'
const routes = new Hono()

routes.route("/upload", uploadRoute)
routes.route("/share", shareRoute)
routes.route("/download", downloadRoute)
routes.route("/status", statusRoute)
routes.route("/cron", cronRoute)

export default routes;
