import type { EmailServiceProps } from "../lib/types";
import { emailVerifyTemplate } from "../templates/email-verify";
import { passwordForgetTemplate } from "../templates/password-forget";
import { orderConfirmationTemplate } from "../templates/order-confirmation";
import { MAILGUN_API_KEY } from "../lib/env";
import { createMessage } from "@upyo/core";
import { MailgunTransport } from "@upyo/mailgun";

export async function sendEmailService({
  to,
  subject,
  text,
  emailType,
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
      // For order confirmation, text should be JSON string with order details
      const orderDetails = JSON.parse(text);
      emailTemplate = orderConfirmationTemplate(
        orderDetails.planName,
        orderDetails.amount,
        orderDetails.tax,
        orderDetails.total,
        orderDetails.customerName
      );
      break;
    default:
      emailTemplate = "";
  }

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
