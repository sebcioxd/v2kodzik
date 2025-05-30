import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index"; // your drizzle instance
import { schema } from "../db/schema";
import { sendEmail } from "./email";
import { BETTER_AUTH_URL, SITE_URL, DOMAIN_WILDCARD } from "./env";
import { emailOTP } from "better-auth/plugins"
import { sendOTPEmail } from "./otp-email"

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: schema,
    }),
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
            }
        }
    },
    trustedOrigins: [SITE_URL],
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }) => {
            const callbackURL = `${BETTER_AUTH_URL}/api/auth/reset-password/${token}?callbackURL=${SITE_URL}/auth/forget/password`
            await sendEmail(user.email, "Zresetuj swoje hasło - dajkodzik.pl", callbackURL, "forget")
        }
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: process.env.NODE_ENV === "production",
            domain: DOMAIN_WILDCARD,
        },
        cookiePrefix: "dajkodzik",
    },  
    plugins: [
        emailOTP({ 
            async sendVerificationOTP({ email, otp}) { 
                await sendOTPEmail(email, otp)
            }, 
            sendVerificationOnSignUp: true,
        }) 
    ]
    
});