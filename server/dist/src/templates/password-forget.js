export const passwordForgetTemplate = (text) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zresetuj hasło - dajkodzik.pl</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, sans-serif; background-color: #09090b; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; border-bottom: 1px solid #27272a; background-color: #09090b;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #f8fafc;">dajkodzik.pl</h1>
              <p style="margin: 10px 0 0 0; color: #71717a;">Przesyłaj pliki w mgnieniu oka</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px; background-color: #09090b;">
              <p style="margin-bottom: 20px; font-size: 16px; line-height: 1.5; color: #a1a1aa;">Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
              
              <p style="margin-bottom: 30px; font-size: 16px; line-height: 1.5; color: #a1a1aa;">Kliknij poniższy przycisk, aby ustawić nowe hasło. Ze względów bezpieczeństwa link jest ważny tylko przez 15 minut.</p>
              
              <!-- Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${text}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #f8fafc; text-decoration: none; border-radius: 4px; background-color: #18181b; border: 1px solid #27272a;">Zresetuj hasło</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-bottom: 20px; font-size: 14px; line-height: 1.5; color: #71717a;">Jeśli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość lub skontaktuj się z nami.</p>
              
              <p style="margin-bottom: 0; font-size: 14px; line-height: 1.5; color: #71717a;">Link do resetowania hasła:</p>
              <p style="margin-top: 10px; margin-bottom: 30px; font-size: 14px; line-height: 1.5; word-break: break-all;">
                <a href="${text}" style="color: #60a5fa; text-decoration: underline;">${text}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; border-top: 1px solid #27272a; background-color: #09090b;">
              <p style="margin: 0; font-size: 14px; color: #71717a; text-align: center;">© 2024 dajkodzik.pl - Wszystkie prawa zastrzeżone.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
