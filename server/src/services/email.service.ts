import type { EmailServiceProps } from '../lib/types'
import { emailVerifyTemplate } from "../templates/email-verify"
import { passwordForgetTemplate } from "../templates/password-forget"
import { SMTP_USER, SMTP_PASS } from '../lib/env'
import { createMessage } from "@upyo/core";
import { SmtpTransport } from "@upyo/smtp";

export async function sendEmailService({ to, subject, text, emailType }: EmailServiceProps) {
    const emailTemplate = emailType === "verify" ? emailVerifyTemplate(text, to) : passwordForgetTemplate(text)

    const transporter = new SmtpTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    })

    const message = createMessage({
        from: SMTP_USER,
        to: to,
        subject: subject,
        content: { html: emailTemplate || "" }
    })

    try {
        await transporter.send(message)
    } catch (err) {
        console.log(err)
    }

}