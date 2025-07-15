import type { EmailServiceProps } from '../lib/types'
import { emailVerifyTemplate } from "../templates/email-verify"
import { passwordForgetTemplate } from "../templates/password-forget"
import { SMTP_USER, SMTP_PASS, MAILGUN_API_KEY } from '../lib/env'
import { createMessage } from "@upyo/core";
import { MailgunTransport } from "@upyo/mailgun";
export async function sendEmailService({ to, subject, text, emailType }: EmailServiceProps) {
    const emailTemplate = emailType === "verify" ? emailVerifyTemplate(text, to) : passwordForgetTemplate(text)

    const transporter = new MailgunTransport({
        apiKey: MAILGUN_API_KEY,
        domain: "mail.dajkodzik.pl",
        region: "eu"
    })

    const message = createMessage({
        from: "hello@dajkodzik.pl",
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