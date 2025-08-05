import Stripe from "stripe";
import { SANDBOX_STRIPE_SECRET_KEY, STRIPE_SECRET_KEY, ENVIRONMENT, SITE_URL } from "../lib/env";
import { User } from "../lib/types";

const stripeClient = new Stripe(ENVIRONMENT === "production" ? STRIPE_SECRET_KEY : SANDBOX_STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
})

export class CheckoutService {
    constructor() {}

    async createCheckoutSession(lineItems: Stripe.Checkout.SessionCreateParams.LineItem[], user: typeof User | null, plan: string) {
        const session = await stripeClient.checkout.sessions.create({
            line_items: lineItems,
            mode: "payment",     
            success_url: `${SITE_URL}/panel/subscription`,
            cancel_url: `${SITE_URL}/panel/subscription`,
            customer: user?.stripeCustomerId as string,
            allow_promotion_codes: true,
            client_reference_id: user?.id as string,
            locale: "pl",
            automatic_tax: {
                enabled: true,
            },
            metadata: {
                plan: plan,
                user_id: user?.id as string,
            },
            invoice_creation: {
                enabled: true,
                invoice_data: {
                    description: "Zamówienie złożone w dajkodzik.pl",
                    footer: "Dziękujemy za zakup w dajkodzik.pl!",
                }
              },
        })
        return session;
    }
    async getBillingPortalSession(customerId: string) {
        const session = await stripeClient.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${SITE_URL}/panel/subscription`,
        })
        return session;
    }
}