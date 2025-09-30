export const confirm2faTemplate = (text: string, status: "enabled" | "disabled", token: string) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Potwierdź swój adres e-mail - dajkodzik.pl</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; line-height: 1.6;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #09090b;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #09090b;">
          
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 40px 0 30px 0;">
              <img src="https://www.dajkodzik.pl/logo-small.png" 
                   alt="dajkodzik.pl" 
                   width="110" 
                   height="100" 
                   style="display: block; border: 0; border-radius: 8px;" />
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0c0e; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px dashed #27272a;">
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.025em;">
                      Potwierdz ${status === "disabled" ? "wyłączenie" : "włączenie"} dwuskładnikowej autoryzacji
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #a1a1aa; font-weight: 400;">
                      Prosimy o potwierdzenie tożsamości przejściem do wymienionego niżej linku.
                    </p>
                  </td>
                </tr>

                <!-- Verification Code Section -->
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #d4d4d8; line-height: 1.5;">
                      Przejdź do wymienionego niżej linku, aby potwierdzić swoją tożsamość:
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="display: inline-block; margin: 0 0 24px 0; padding: 20px 32px; background-color: #09090b; border: 2px solid #2c2c30; border-radius: 8px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;">
                      <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.4;">
                        Przejdź do tego linku, aby ${status === "disabled"  ? "wyłączyć" : "włączyć"} dwuskładnikową autoryzację: <a href="https://dajkodzik.pl/panel/security?token=${token}" style="color: #d4d4d8; text-decoration: underline;">${status === "disabled" ? "Wyłącz 2FA" : "Włącz 2FA"}</a>
                      </p>
                    </div>

                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #d4d4d8; line-height: 1.5;">
                      Jeśli to nie ty wywołałeś tę akcję, zignoruj ten e-mail i zresetuj swoje hasło.
                    </p>

                    <div style="margin: 24px 0 0 0; padding: 16px; background-color: #09090b; border: 1px solid #27272a; border-radius: 6px;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a; line-height: 1.4;">
                        Token wygaśnie za 30 minut
                      </p>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #52525b;">
                © 2025 dajkodzik.pl · Przesyłaj pliki w mgnieniu oka
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`