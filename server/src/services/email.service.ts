import type { EmailServiceProps } from "../lib/types";
import { emailVerifyTemplate } from "../templates/email-verify";
import { passwordForgetTemplate } from "../templates/password-forget";
import { orderConfirmationTemplate } from "../templates/order-confirmation";
import { cancellationTemplate } from "../templates/cancellation";
import { dataRequestTemplate } from "../templates/data-request";
import { accountDeletionTemplate } from "../templates/account-deletion";
import { twoFactorTemplate } from "../templates/2fa-template";
import { confirm2faTemplate } from "../templates/confirm-2fa";
import { MAILGUN_API_KEY, SMTP_PASS, SMTP_USER, ENVIRONMENT } from "../lib/env";
import { createMessage } from "@upyo/core";
import { MailgunTransport } from "@upyo/mailgun";
import { SmtpTransport } from "@upyo/smtp";

export async function sendEmailService({
  to,
  subject,
  text,
  emailType,
  attachments,
}: EmailServiceProps) {
  let emailTemplate: string;
  
  switch (emailType) {
    case "verify":
      emailTemplate = emailVerifyTemplate(text, to);
      break;
    case "forget":
      emailTemplate = passwordForgetTemplate(text);
      break;
    case "order-confirmation":
      const orderDetails = JSON.parse(text);
      emailTemplate = orderConfirmationTemplate(
        orderDetails.planName,
        orderDetails.amount,
        orderDetails.total,
        orderDetails.customerName
      );
      break;
    case "cancellation":
      const cancellationDetails = JSON.parse(text);
      emailTemplate = cancellationTemplate(
        cancellationDetails.planName,
        cancellationDetails.customerName
      );
      break;
    case "data-request":
      const userDetails = JSON.parse(text);
      emailTemplate = dataRequestTemplate(userDetails.customerName);
      break;
    case "account-deletion":
      const deletionDetails = JSON.parse(text);
      emailTemplate = accountDeletionTemplate(
        deletionDetails.customerName,
        deletionDetails.deletionUrl
      );
      break;
    case "2fa":
      const twoFactorDetails = JSON.parse(text);
      emailTemplate = twoFactorTemplate(twoFactorDetails.text, twoFactorDetails.email, twoFactorDetails.token);
      break;
    case "confirm-2fa":
      const confirm2faDetails = JSON.parse(text);
      emailTemplate = confirm2faTemplate(confirm2faDetails.text, confirm2faDetails.status, confirm2faDetails.token);
      break;
    default:
      emailTemplate = "";
  }

  let transport;
  if (ENVIRONMENT === "development") {
    transport = new SmtpTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    transport = new MailgunTransport({
      apiKey: MAILGUN_API_KEY,
      domain: "mail.dajkodzik.pl",
      region: "eu",
    })
  }
  

  const message = createMessage({
    from: ENVIRONMENT === "development" ? `Dajkodzik.pl <${SMTP_USER}>` : "Dajkodzik.pl <no-reply@dajkodzik.pl>",
    to: to,
    subject: subject,
    content: { html: emailTemplate || "" },
    attachments: attachments,
  });

  try {
    await transport?.send(message);
  } catch (err) {
    console.log(err);
  }
}
