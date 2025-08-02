import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"
import { inferAdditionalFields } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client"

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    fetchOptions: {
        credentials: "include",
    },
    plugins: [emailOTPClient(), inferAdditionalFields({
        user: {
            ipAddress: {
                type: "string",
            },
            userAgent: {
                type: "string",
            },
            oauth: {
                type: "boolean",
            }
        }
    }),
    stripeClient({
        subscription: true
    })],
})

export const { signIn, signUp, useSession, signOut } = authClient

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export type UserWithSession = {
    session: Session;
    user: User;
}