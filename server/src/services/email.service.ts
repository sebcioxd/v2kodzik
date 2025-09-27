import type { EmailServiceProps } from "../lib/types";
import { emailVerifyTemplate } from "../templates/email-verify";
import { passwordForgetTemplate } from "../templates/password-forget";
import { orderConfirmationTemplate } from "../templates/order-confirmation";
import { cancellationTemplate } from "../templates/cancellation";
import { dataRequestTemplate } from "../templates/data-request";
import { accountDeletionTemplate } from "../templates/account-deletion";
import { MAILGUN_API_KEY } from "../lib/env";
import { createMessage, type Attachment } from "@upyo/core";
import { MailgunTransport } from "@upyo/mailgun";

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
    attachments: attachments,
  });

  try {
    await transport.send(message);
  } catch (err) {
    console.log(err);
  }
}
