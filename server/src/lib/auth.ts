import { APIError, AuthContext, betterAuth, EndpointOptions, MiddlewareContext } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index"; 
import { schema, user, account, monthlyIPlimits, twoFactor } from "../db/schema";
import { sendEmailService } from "../services/email.service";
import { MonthlyUsageService } from "../services/monthly-limits.service";
import { BETTER_AUTH_URL, SITE_URL, DOMAIN_WILDCARD, ENVIRONMENT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, STRIPE_SECRET_KEY, STRIPE_AUTH_WEBHOOK_SECRET, SANDBOX_STRIPE_AUTH_WEBHOOK_SECRET, SANDBOX_STRIPE_SECRET_KEY } from "../lib/env";
import { createAuthMiddleware, emailOTP } from "better-auth/plugins"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import { eq } from "drizzle-orm";
import crypto from "node:crypto"

// bunx --bun @better-auth/cli generate --config ./src/lib/auth.ts <-- to generate the schema

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

async function createSessionCookie(ctx: MiddlewareContext<EndpointOptions, AuthContext & {
    returned?: unknown;
    responseHeaders?: Headers;
}>, userId: string) {
    const session = await ctx.context.internalAdapter.createSession(
        userId,
        ctx,
        !ctx.body?.rememberMe,
    );

    const { name: cookieName, attributes: cookieAttributes } = ctx.context.createAuthCookie("session_token");


    // if remember me is true, set the max age to 7 days (so the user will be logged in for 7 days)
    if (ctx.body?.rememberMe) {
        cookieAttributes.maxAge = 60 * 60 * 24 * 7 // 7 days;
    }

    const signedCookie = await ctx.setSignedCookie(cookieName, session.token, ctx.context.secret, cookieAttributes);

    return signedCookie;
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
            twofactorEnabled: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: true,
            }
        }, 
        deleteUser: {
            enabled: true,
            sendDeleteAccountVerification: async (
                {
                    user,
                    url,
                }) => {
                const deletionDetails = {
                    customerName: user.name || user.email,
                    deletionUrl: url
                };
                
                await sendEmailService({
                    to: user.email,
                    subject: "Potwierdź usunięcie konta - dajkodzik.pl",
                    text: JSON.stringify(deletionDetails),
                    emailType: "account-deletion"
                });
            },
        }
    },
    trustedOrigins: [SITE_URL],
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            
            
            if (ctx.path.startsWith("/sign-in/email")) {
                const ipAddress = ctx.headers?.get("CF-Connecting-IP") || ctx.headers?.get("x-forwarded-for") || "127.0.0.1";
                
                const data = await db.select()
                    .from(user)
                    .where(eq(user.email, ctx.body?.email))
                    .limit(1);
                    
                
                    
                if (data.length > 0 && data[0].ipAddress !== ipAddress && data[0].twofactorEnabled) {
                    const accountData = await db.select()
                        .from(account)
                        .where(eq(account.userId, data[0].id));

                    const credentialAccount = accountData.find(acc => acc.providerId === "credential");

                  
                    
                    if (credentialAccount?.password) {
                        const verify = await ctx.context.password.verify({
                            hash: credentialAccount.password, 
                            password: ctx.body?.password,
                        });
                        if (verify && ipAddress !== data[0].ipAddress) {
                            const twoFactorData = await db.insert(twoFactor).values({
                                userId: data[0].id,
                                secret: crypto.randomInt(100000, 999999),
                                token: Bun.randomUUIDv7(),
                                cookie: await createSessionCookie(ctx, data[0].id),
                            }).returning();


                            await sendEmailService({
                                to: ctx.body?.email,
                                subject: "Zweryfikuj swoją tożsamość - dajkodzik.pl",
                                text: JSON.stringify({
                                    text: twoFactorData[0].secret.toString(),
                                    email: ctx.body?.email,
                                    token: twoFactorData[0].token
                                }),
                                emailType: "2fa"
                            });

                            throw new APIError("TEMPORARY_REDIRECT", {
                                message: "IP address changed",
                                authToken: twoFactorData[0].token,
                                email: ctx.body?.email,
                            });
                
                        }
                    }
                }
            }

        }),
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
                const sessionUser = ctx.context.newSession.user;
                const ipAddress = ctx.headers?.get("CF-Connecting-IP") || ctx.headers?.get("x-forwarded-for") || "127.0.0.1";


                if (sessionUser.ipAddress !== ipAddress) {
                    await db.update(user).set({
                        ipAddress: ipAddress,
                        userAgent: ctx.headers?.get("user-agent") || "",
                    }).where(eq(user.id, sessionUser.id));
                }

                const accounts = await db.select()
                    .from(account)
                    .where(eq(account.userId, sessionUser.id));
                
                const hasPassword = accounts.find((account) => account.providerId === "credential");

                if (hasPassword) {
                    await db.update(user).set({
                        oauth: false,
                    }).where(eq(user.id, sessionUser.id));
                    ctx.redirect(`${SITE_URL}/panel`);
                }
                
                if (!hasPassword) { 
                    await db.update(user).set({
                        oauth: true,
                    }).where(eq(user.id, sessionUser.id));
                    ctx.redirect(`${SITE_URL}/oauth-password`);
                }

                const existingLimits = await db.select()
                    .from(schema.monthlyLimits)
                    .where(eq(schema.monthlyLimits.userId, sessionUser.id))
                    .limit(1);
                
                if (existingLimits.length === 0) {

                    const [limits] = await db.select()
                        .from(monthlyIPlimits)
                        .where(eq(monthlyIPlimits.ipAddress, ipAddress))
                        .limit(1);
                        
                    const usedFromIP = limits ? limits.megabytesUsed : 0;

                    await db.insert(schema.monthlyLimits).values({
                        userId: sessionUser.id,
                        megabytesLimit: 1000,
                        megabytesUsed: usedFromIP,
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

                        const amountInCents = price?.unit_amount || 0;
                        const amountInPLN = (amountInCents / 100).toFixed(2);

                        const orderDetails = {
                            planName: plan.name || "Nieznany",
                            amount: amountInPLN,
                            total: amountInPLN,
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
                    
                    switch (plan.name) {
                        case "basic":
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 10000, // 10GB
                            })
                            break;
                        case "plus":
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd: 50000, // 50GB
                            })
                            break;
                        case "pro":
                            await monthlyService.increaseMonthlyLimits({
                                referenceId: subscription.referenceId,
                                megabytesToAdd:  150000, // 150GB
                            })
                            break;
                    } 
                    
                },
                onSubscriptionCancel: async ({ subscription, stripeSubscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    if (stripeSubscription.status === 'canceled' && stripeSubscription.cancel_at_period_end === false) {
                        await monthlyService.resetMonthlyLimits({
                            referenceId: subscription.referenceId,
                        });
                        
                        const userEmail = await getUserEmailByReferenceId(subscription.referenceId);
                        if (userEmail) {
                            const cancellationDetails = {
                                planName: subscription.plan, 
                                customerName: subscription.referenceId
                            };
                            
                            await sendEmailService({
                                to: userEmail,
                                subject: "Subskrypcja anulowana - dajkodzik.pl",
                                text: JSON.stringify(cancellationDetails),
                                emailType: "cancellation"
                            });
                        }
                    }
                },
                onSubscriptionDeleted: async ({  subscription, stripeSubscription }) => {
                    const monthlyService = new MonthlyUsageService();

                    await monthlyService.resetMonthlyLimits({
                        referenceId: subscription.referenceId,
                    })
                },
                onSubscriptionUpdate: async ({ subscription, event }) => {
                    const monthlyService = new MonthlyUsageService();

                    const stripeSub = event.data.object as Stripe.Subscription;
                    const newPriceId = stripeSub.items?.data[0]?.price?.id;

                    if (subscription.status === "canceled" && subscription.cancelAtPeriodEnd === false) {
                        await monthlyService.resetMonthlyLimits({
                            referenceId: subscription.referenceId,
                        });
                    }

                    if (subscription.status === "canceled" && 
                        subscription.cancelAtPeriodEnd === true && 
                        subscription.periodEnd) {
                        await monthlyService.resetMonthlyLimits({
                            referenceId: subscription.referenceId,
                        });
                    }

                    const priceIdToPlanMap = {
                        // Sandbox price IDs
                        "price_1RrhMe1d5ff1ueqRvBxqfePA": "basic",
                        "price_1RrhZW1d5ff1ueqRU3Ib2EXy": "plus", 
                        "price_1Rrha51d5ff1ueqRl8pBbUYM": "pro",
                        // Production price IDs
                        "price_1RrpUM12nSzGEbfJ2YnfVFtE": "basic",
                        "price_1RrpaS12nSzGEbfJhRq73THv": "plus",
                        "price_1Rrpbc12nSzGEbfJco6U50U7": "pro"
                    };
                    const newPlan = priceIdToPlanMap[newPriceId as keyof typeof priceIdToPlanMap];


                    if (subscription.status === "active" || subscription.status === "trialing") {
                        switch (newPlan) {
                            case "basic":
                                await monthlyService.increaseMonthlyLimits({
                                    referenceId: subscription.referenceId,
                                    megabytesToAdd: 10000, // 10GB
                                })
                                break;
                            case "plus":
                                await monthlyService.increaseMonthlyLimits({
                                    referenceId: subscription.referenceId,
                                    megabytesToAdd: 50000, // 50GB
                                })
                                break;
                            case "pro":
                                await monthlyService.increaseMonthlyLimits({
                                    referenceId: subscription.referenceId,
                                    megabytesToAdd: 150000, // 150GB
                                })
                                break;
                        }
                    }
                },
                getCheckoutSessionParams: async ({ user, session, plan, subscription }, request) => {
                    return {
                        params: {
                            allow_promotion_codes: true,
                            automatic_tax: {
                                enabled: true,
                            },
                            locale: "pl",
                        },
                    };
                }
            },
        })
    ]
    
});
