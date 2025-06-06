import { auth } from "../lib/auth.ts";
export const Session = auth.$Infer.Session;
export const User = auth.$Infer.Session.user;
