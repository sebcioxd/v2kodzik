import type { EmailServiceProps } from '../lib/types.ts'
import { emailVerifyTemplate } from "../templates/email-verify.ts"
import { passwordForgetTemplate } from "../templates/password-forget.ts"
import { SMTP_USER, SMTP_PASS } from '../lib/env.ts'
import nodemailer from 'nodemailer'



export async function sendEmailService({ to, subject, text, emailType }: EmailServiceProps) {
    const emailTemplate = emailType === "verify" ? emailVerifyTemplate(text) : passwordForgetTemplate(text)

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, 
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    })

    const mailOptions = {
        from: SMTP_USER,
        to: to,
        subject: subject,
        html: emailTemplate
    }

    try {
        await transporter.sendMail(mailOptions)
    } catch (err) {
        console.log(err)
    }

}