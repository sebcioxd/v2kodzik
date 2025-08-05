import { Hono } from "hono"
import { CheckoutService } from "../services/checkout.service"
import { AuthSession } from "../lib/types"


const checkoutRoute = new Hono<AuthSession>()
const checkoutService = new CheckoutService()

checkoutRoute.post("/checkout", async (c) => {
    const { lineItems, plan } = await c.req.json()
    const user = c.get("user")

    if (!user) {
        return c.json({
            message: "Nie jesteś zalogowany",
        }, 401)
    }

    const session = await checkoutService.createCheckoutSession(lineItems, user, plan)

    return c.json({
        url: session.url,
    })
})

checkoutRoute.get("/portal/:customerId", async (c) => {
    const customerId = c.req.param("customerId")
    const user = c.get("user")

    if (!user) {
        return c.json({
            message: "Nie jesteś zalogowany",
        }, 401)
    }

    const session = await checkoutService.getBillingPortalSession(customerId)
    return c.json({
        url: session.url,
    })
})

export default checkoutRoute