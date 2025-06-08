import { Hono } from "hono"

const helloRoute = new Hono()

helloRoute.get("/", (c) => {
	return c.text("Cześć z dajkodzik API!")
})

export default helloRoute