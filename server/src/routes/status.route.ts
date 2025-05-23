import { Hono } from "hono";
const statusRoute = new Hono();


statusRoute.get("/", async (c) => {
  return c.json({ message: "API działa poprawnie", status: 200 }, 200);
});

export default statusRoute;