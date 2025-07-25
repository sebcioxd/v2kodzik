import type { EmailServiceProps } from "../lib/types";
import { emailVerifyTemplate } from "../templates/email-verify";
import { passwordForgetTemplate } from "../templates/password-forget";
import { MAILGUN_API_KEY } from "../lib/env";
import { createMessage } from "@upyo/core";
import { MailgunTransport } from "@upyo/mailgun";

export async function sendEmailService({
  to,
  subject,
  text,
  emailType,
}: EmailServiceProps) {
  const emailTemplate =
    emailType === "verify"
      ? emailVerifyTemplate(text, to)
      : passwordForgetTemplate(text);

  const transport = new MailgunTransport({
    apiKey: MAILGUN_API_KEY,
    domain: "mail.dajkodzik.pl",
    region: "eu",
  });

  const message = createMessage({
    from: "Dajkodzik.pl <no-reply@dajkodzik.pl>",
    to: to,
    subject: subject,
    content: { html: emailTemplate || "" },
  });

  try {
    await transport.send(message);
  } catch (err) {
    console.log(err);
  }
}
