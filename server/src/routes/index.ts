import { Hono } from 'hono'
import uploadRoute from './upload.route'
import shareRoute from './share.route'
import downloadRoute from './download.route'
const routes = new Hono()

routes.route("/upload", uploadRoute)
routes.route("/share", shareRoute)
routes.route("/download", downloadRoute)

export default routes;
