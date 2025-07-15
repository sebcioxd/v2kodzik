import { Hono } from "hono"

const helloRoute = new Hono()

helloRoute.get("/", (c) => {
	return c.text("'99, took Astroworld, it had to relocate")
})

export default helloRoute