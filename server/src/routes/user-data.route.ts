import { Hono } from "hono";
import { db } from "../db/index";
import { snippets, user as userTable, account, subscription, sharesHistory, monthlyLimits } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { AuthSession } from "../lib/types";
import { sendEmailService } from "../services/email.service";
import { createRateLimiter } from "../services/rate-limit.service";

const userDataRoute = new Hono<AuthSession>();

userDataRoute.get("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({
      message: "Nie jesteś zalogowany",
    }, 401);
  }

  const [userData, accountData, subscriptionData, monthlyLimitsData, sharesHistoryData] = await Promise.all([
    db.select().from(userTable).where(eq(userTable.id, user.id)),
    db.select().from(account).where(eq(account.userId, user.id)),
    db.select().from(subscription).where(eq(subscription.referenceId, user.id as string)),
    db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, user.id)),
    db.select().from(sharesHistory).where(eq(sharesHistory.userId, user.id)),
  ]);


  return c.json({ userData, accountData, subscriptionData, monthlyLimitsData, sharesHistoryData }, 200);
});

userDataRoute.get("/request-email", createRateLimiter("dataRequest"), async (c) => {
    const user = c.get("user");
  
    if (!user) {
      return c.json({
        message: "Nie jesteś zalogowany",
      }, 401);
    }
  
    try {
      const [userData, accountData, subscriptionData, monthlyLimitsData, sharesHistoryData, snippetsData] = await Promise.all([
        db.select().from(userTable).where(eq(userTable.id, user.id)),
        db.select().from(account).where(eq(account.userId, user.id)),
        db.select().from(subscription).where(eq(subscription.referenceId, user.id as string)),
        db.select().from(monthlyLimits).where(eq(monthlyLimits.userId, user.id)),
        db.select().from(sharesHistory).where(eq(sharesHistory.userId, user.id)),
        db.select().from(snippets).where(eq(snippets.userId, user.id)).orderBy(desc(snippets.createdAt)),
      ]);

      const completeUserData = {
        userData,
        accountData,
        subscriptionData,
        monthlyLimitsData,
        sharesHistoryData,
        snippetsData,
        exportDate: new Date().toISOString(),
        exportVersion: "1.0"
      };

      const jsonData = JSON.stringify(completeUserData, null, 2);
      const fileName = `user-data-${user.name || user.email}-${new Date().toISOString().split('T')[0]}.json`;
      
      const jsonFile = new File([jsonData], fileName, {
        type: "application/json"
      });

      await sendEmailService({
        to: user.email,
        subject: "Twoje dane - dajkodzik.pl",
        text: JSON.stringify({ customerName: user.name || user.email }),
        emailType: "data-request",
        attachments: jsonFile
      });

      return c.json({
        message: "Dane zostały wysłane na Twój adres email",
        success: true
      }, 200);

    } catch (error) {
      console.error("Error sending user data email:", error);
      return c.json({
        message: "Wystąpił błąd podczas wysyłania danych",
        success: false
      }, 500);
    }
  });
  
export default userDataRoute;
  