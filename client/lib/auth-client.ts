import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"
import { inferAdditionalFields } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client"
// import { type BetterFetchPlugin } from "better-auth/react";

// export const redirectPlugin = {
// 	id: "redirect",
// 	name: "Redirect",
// 	hooks: {
// 		onSuccess(context) {
// 			if (context.data?.url && context.data?.redirect) {
// 				if (typeof window !== "undefined" && window.location) {
// 					if (window.location) {
// 						try {
// 							window.location.href = context.data.url;
// 						} catch {}
// 					}
// 				}
// 			}
// 		},
// 	},
// } satisfies BetterFetchPlugin;




export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    fetchOptions: {
        credentials: "include",
        onRequest(ctx) {
            ctx.headers.append("x-real-user-agent", navigator.userAgent)
        }
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
            },
            twofactorEnabled: {
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