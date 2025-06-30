import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js"; 
import { schema } from "../db/schema.js";
import { sendEmailService } from "../services/email.service.js";
import { BETTER_AUTH_URL, SITE_URL, DOMAIN_WILDCARD, ENVIRONMENT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "../lib/env.js";
import { emailOTP } from "better-auth/plugins"

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
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
            }
        }
    },
    
    trustedOrigins: [SITE_URL],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
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
            clientId: DISCORD_CLIENT_ID,
            clientSecret: DISCORD_CLIENT_SECRET,
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
                    subject: "Verify your email",
                    text: otp,
                    emailType: "verify"
                })
            }, 
            sendVerificationOnSignUp: true,
        }) 
    ]
    
});



