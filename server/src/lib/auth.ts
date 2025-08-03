import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index"; 
import { schema } from "../db/schema";
import { sendEmailService } from "../services/email.service";
import { MonthlyUsageService } from "../services/monthly-limits.service";
import { BETTER_AUTH_URL, SITE_URL, DOMAIN_WILDCARD, ENVIRONMENT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_AUTH_WEBHOOK_SECRET, SANDBOX_STRIPE_AUTH_WEBHOOK_SECRET, SANDBOX_STRIPE_SECRET_KEY } from "../lib/env";
import { createAuthMiddleware, emailOTP } from "better-auth/plugins"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { eq } from "drizzle-orm";

async function getUserEmailByReferenceId(referenceId: string): Promise<string | null> {
    try {
        const user = await db.select({ email: schema.user.email })
            .from(schema.user)
            .where(eq(schema.user.id, referenceId))
            .limit(1);
        
        return user[0]?.email || null;
    } catch (error) {
        console.error("Error getting user email:", error);
        return null;
    }
}

const stripeClient = new Stripe(ENVIRONMENT === "production" ? STRIPE_SECRET_KEY : SANDBOX_STRIPE_SECRET_KEY, {
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
            stripeWebhookSecret: ENVIRONMENT === "production" ? STRIPE_AUTH_WEBHOOK_SECRET : SANDBOX_STRIPE_AUTH_WEBHOOK_SECRET,
            createCustomerOnSignUp: true,
            subscription: {
                enabled: true,
                plans: [
                    {
                        name: "basic",
                        priceId: ENVIRONMENT === "production" ? "price_1RrpUM12nSzGEbfJ2YnfVFtE" : "price_1RrhMe1d5ff1ueqRvBxqfePA",  
                        // sandbox: price_1RrhMe1d5ff1ueqRvBxqfePA 
                        // prod: price_1RrpUM12nSzGEbfJ2YnfVFtE
                    },
                    {
                        name: "plus",
                        priceId: ENVIRONMENT === "production" ? "price_1RrpaS12nSzGEbfJhRq73THv" : "price_1RrhZW1d5ff1ueqRU3Ib2EXy", 
                        // sandbox: price_1RrhZW1d5ff1ueqRU3Ib2EXy
                        // prod: price_1RrpaS12nSzGEbfJhRq73THv
                    },
                    {
                        name: "pro",
                        priceId: ENVIRONMENT === "production" ? "price_1Rrpbc12nSzGEbfJco6U50U7" : "price_1Rrha51d5ff1ueqRl8pBbUYM", 
                        // sandbox: price_1Rrha51d5ff1ueqRl8pBbUYM
                        // prod: price_1Rrpbc12nSzGEbfJco6U50U7
                    },
                ],
                onSubscriptionComplete: async ({ subscription, plan, stripeSubscription }) => {
                        
                    const monthlyService = new MonthlyUsageService();
                    
                    const userEmail = await getUserEmailByReferenceId(subscription.referenceId);
                    
                    if (userEmail) {
                        const subscriptionItem = stripeSubscription.items?.data[0];
                        const price = subscriptionItem?.price;
              
                        
                        // Get the amount in PLN (convert from cents)
                        const amountInCents = price?.unit_amount || 0;
                        const amountInPLN = (amountInCents / 100).toFixed(2);
                        
                        // Calculate tax correctly (23% VAT in Poland)
                        const amountInPLNNumber = parseFloat(amountInPLN);
                        const taxAmount = (amountInPLNNumber * 0.23).toFixed(2);
                        const totalAmount = (amountInPLNNumber * 1.23).toFixed(2);

                        const orderDetails = {
                            planName: plan.name || "Nieznany",
                            amount: amountInPLN,
                            tax: taxAmount,
                            total: totalAmount,
                            currency: price?.currency?.toUpperCase() || "PLN",
                            customerName: subscription.referenceId
                        };
                        
                        await sendEmailService({
                            to: userEmail,
                            subject: "Potwierdzenie zamówienia - dajkodzik.pl",
                            text: JSON.stringify(orderDetails),
                            emailType: "order-confirmation"
                        });
                    }
                    
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

                    if (stripeSubscription.status === 'canceled') {
                        await monthlyService.resetMonthlyLimits({
                            referenceId: subscription.referenceId,
                        })
                    }
                },
                onSubscriptionDeleted: async ({  subscription, stripeSubscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    await monthlyService.resetMonthlyLimits({
                        referenceId: subscription.referenceId,
                    })
                },
                onSubscriptionUpdate: async ({ subscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    await monthlyService.resetMonthlyLimits({
                        referenceId: subscription.referenceId,
                    });
                    
                    switch (subscription.priceId) {
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
                                megabytesToAdd: 150000, // 150GB
                            })
                            break;
                    }
                },
                getCheckoutSessionParams: async ({ user, session, plan, subscription }, request) => {
                    return {
                        params: {
                            allow_promotion_codes: true,
                            automatic_tax: {
                                enabled: true,
                            },
                        },
                    };
                }
            }
        })
    ]
    
});



