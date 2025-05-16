import { Hono } from 'hono'

type Binding = {
  MY_VAR: string
}

const app = new Hono<{ Bindings: Binding }>()

app.get('/', (c) => {
  return c.text(`Hello from hono. Env var: ${c.env.MY_VAR}`)
})

export default app
