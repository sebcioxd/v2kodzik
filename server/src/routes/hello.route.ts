import { Hono } from "hono"

const helloRoute = new Hono()

helloRoute.get("/", (c) => {
	return c.text("Hello Hono!")
})

export default helloRoute