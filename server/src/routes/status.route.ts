import { Hono } from "hono";
const statusRoute = new Hono();


statusRoute.get("/", async (c) => {
  return c.json({ message: "API działa poprawnie" }, 200);
});

export default statusRoute;