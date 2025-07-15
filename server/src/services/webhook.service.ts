import type { SendWebhookServiceProps } from "../lib/types";
import { DISCORD_WEBHOOK_URL } from "../lib/env";

export async function sendWebhookService({
  content,
}: SendWebhookServiceProps) {

  try {
    await fetch(DISCORD_WEBHOOK_URL, 
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: content,
        }),
    });

  } catch (error) {
    console.error("Nie udało się wysłać webhooka", error);
  }
}