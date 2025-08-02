import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index"; 
import { schema } from "../db/schema";
import { sendEmailService } from "../services/email.service";
import { MonthlyUsageService } from "../services/monthly-limits.service";
import { BETTER_AUTH_URL, SITE_URL, DOMAIN_WILDCARD, ENVIRONMENT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_AUTH_WEBHOOK_SECRET } from "../lib/env";
import { createAuthMiddleware, emailOTP } from "better-auth/plugins"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { eq } from "drizzle-orm";

const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
})

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
    account: {
        accountLinking: {
            enabled: true,
        },
    },
    basePath: "/v1/auth",
    user: {
        additionalFields: {
            ipAddress: {
                type: "string",
                required: false,
                defaultValue: null,
                input: true,
            },
            userAgent: {
                type: "string",
                required: false,
                defaultValue: null,
                input: true,
            },
            oauth: {
                type: "boolean",
                required: false,
                defaultValue: false,
                input: true,
            },
        }
    },
    trustedOrigins: [SITE_URL],
    hooks: {
        after: createAuthMiddleware(async (ctx) => {       
            if (ctx.path.startsWith("/sign-up")) {
                const user = ctx.context.newSession?.user;
                if (user) {
                    await db.insert(schema.monthlyLimits).values({
                        userId: user.id,
                        megabytesLimit: 1000,
                        megabytesUsed: 0,
                    })
                }
            }
            
            if (ctx.path.startsWith("/callback") && ctx.context.newSession?.user) {
                const user = ctx.context.newSession.user;


                const existingLimits = await db.select()
                    .from(schema.monthlyLimits)
                    .where(eq(schema.monthlyLimits.userId, user.id))
                    .limit(1);
                
                if (existingLimits.length === 0) {
                    await db.insert(schema.monthlyLimits).values({
                        userId: user.id,
                        megabytesLimit: 1000,
                        megabytesUsed: 0,
                    })
                
                }
            }
        })
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        resetPasswordTokenExpiresIn: 30 * 60,
        password: {
            hash: async (password) => {
                return await Bun.password.hash(password);
            },
            verify: async (data) => {
                return await Bun.password.verify(data.password, data.hash);
            },
        },
        sendResetPassword: async ({ user, token }) => {
            const callbackURL = `${BETTER_AUTH_URL}/v1/auth/reset-password/${token}?callbackURL=${SITE_URL}/auth/forget/password`
            await sendEmailService({
                to: user.email,
                subject: "Zresetuj swoje hasło - dajkodzik.pl",
                text: callbackURL,
                emailType: "forget"
            })
        }
    },
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId : GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        },
        discord: {
            prompt: "consent",
            clientId: DISCORD_CLIENT_ID,
            clientSecret: DISCORD_CLIENT_SECRET,
            scope: ["identify", "email", "guilds", "guilds.join"],
        }
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: ENVIRONMENT === "production",
            domain: DOMAIN_WILDCARD,
        },
        cookiePrefix: "dajkodzik",
    },  
    plugins: [
        emailOTP({ 
            async sendVerificationOTP({ email, otp}) { 
                await sendEmailService({
                    to: email,
                    subject: "Zweryfikuj swój adres e-mail - dajkodzik.pl",
                    text: otp,
                    emailType: "verify"
                })
            }, 
            sendVerificationOnSignUp: true,
            expiresIn: 30 * 60,
        }),
        stripe({
            stripeClient,
            stripeWebhookSecret: STRIPE_AUTH_WEBHOOK_SECRET,
            createCustomerOnSignUp: true,
            subscription: {
                enabled: true,
                plans: [
                    {
                        name: "basic",
                        priceId: "price_1RrhMe1d5ff1ueqRvBxqfePA", 
                    },
                    {
                        name: "plus",
                        priceId: "price_1RrhZW1d5ff1ueqRU3Ib2EXy", 
                    },
                    {
                        name: "pro",
                        priceId: "price_1Rrha51d5ff1ueqRl8pBbUYM", 
                    },
                ],
                onSubscriptionComplete: async ({ subscription, plan }) => {
                    const monthlyService = new MonthlyUsageService();
                    
                    switch (plan.priceId) {
                        case "price_1RrhMe1d5ff1ueqRvBxqfePA": // basic
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 10000, // 10GB
                            })
                            break;
                        case "price_1RrhZW1d5ff1ueqRU3Ib2EXy": // plus
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 50000, // 50GB
                            })
                            break;
                        case "price_1Rrha51d5ff1ueqRl8pBbUYM": // pro
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd:  150000, // 150GB
                            })
                            break;
                    } 
                    
                },
                onSubscriptionCancel: async ({ subscription, stripeSubscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    if (stripeSubscription.status === 'canceled' || stripeSubscription.cancel_at_period_end) {
                        if (stripeSubscription.status === 'canceled') {
                            switch (stripeSubscription.items.data[0].plan.id) {
                                case "price_1RrhMe1d5ff1ueqRvBxqfePA": // basic
                                    await monthlyService.decreaseMonthlyLimits({
                                        referenceId: subscription.referenceId,
                                        megabytesToSubtract: 10000, // 10GB
                                    })
                                    break;
                                case "price_1RrhZW1d5ff1ueqRU3Ib2EXy": // plus
                                    await monthlyService.decreaseMonthlyLimits({
                                        referenceId: subscription.referenceId,
                                        megabytesToSubtract: 50000, // 50GB
                                    })
                                    break;
                                case "price_1Rrha51d5ff1ueqRl8pBbUYM": // pro
                                    await monthlyService.decreaseMonthlyLimits({
                                        referenceId: subscription.referenceId,
                                        megabytesToSubtract: 150000, // 150GB
                                    })
                                    break;
                            }
                        }
                    }
                },
                onSubscriptionDeleted: async ({  subscription, stripeSubscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    switch (stripeSubscription.items.data[0].plan.id) {
                        case "price_1RrhMe1d5ff1ueqRvBxqfePA": // basic
                            await monthlyService.decreaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToSubtract: 10000, // 10GB
                            })
                            break;
                        case "price_1RrhZW1d5ff1ueqRU3Ib2EXy": // plus
                            await monthlyService.decreaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToSubtract: 50000, // 50GB
                            })
                            break;
                        case "price_1Rrha51d5ff1ueqRl8pBbUYM": // pro
                            await monthlyService.decreaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToSubtract: 150000, // 150GB
                            })
                            break;
                    }
                },
                onSubscriptionUpdate: async ({ subscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    switch (subscription.priceId) {
                        case "price_1RrhMe1d5ff1ueqRvBxqfePA": // basic
                            await monthlyService.resetMonthlyLimits({
                                referenceId: subscription.referenceId,
                            })
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 10000, // 10GB
                            })
                            break;
                        case "price_1RrhZW1d5ff1ueqRU3Ib2EXy": // plus  
                            await monthlyService.resetMonthlyLimits({
                                referenceId: subscription.referenceId,
                            })
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 50000, // 50GB
                            })
                            break;
                        case "price_1Rrha51d5ff1ueqRl8pBbUYM": // pro
                            await monthlyService.resetMonthlyLimits({
                                referenceId: subscription.referenceId,
                            })
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 150000, // 150GB
                            })
                            break;
                    }
                    
                },
            }
        })
    ]
    
});



