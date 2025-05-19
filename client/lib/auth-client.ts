import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: "http://localhost:8080",
    fetchOptions: {
        credentials: "include",
    },
})

export const { signIn, signUp, useSession, signOut } = authClient

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export type UserWithSession = {
    session: Session;
    user: User;
}