import { auth } from "./auth";
import { Env } from "hono";

export const Session = auth.$Infer.Session
export const User = auth.$Infer.Session.user

export interface AuthSession extends Env {
    Variables: {
        session: typeof Session | null
        user: typeof User | null
    }
}