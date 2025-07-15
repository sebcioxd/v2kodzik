export const passwordForgetTemplate = (text: string) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zresetuj hasło - dajkodzik.pl</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #09090b; color: #f4f4f5; line-height: 1.6;">
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
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.025em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                      Zresetuj hasło
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #a1a1aa; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                      Otrzymaliśmy prośbę o reset hasła
                    </p>
                  </td>
                </tr>

                <!-- Reset Button Section -->
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #d4d4d8; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                      Kliknij poniższy przycisk, aby ustawić nowe hasło:
                    </p>
                    
                    <!-- Reset Button -->
                    <div style="margin: 0 0 24px 0;">
                      <a href="${text}" 
                         target="_blank" 
                         style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: 500; color: #f4f4f5; text-decoration: none; background-color: #09090b; border: 2px solid #2c2c30; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                        🔐 Ustaw nowe hasło
                      </a>
                    </div>

                    <div style="margin: 24px 0 0 0; padding: 16px; background-color: #09090b; border: 1px solid #27272a; border-radius: 6px;">
                      <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                        ⏰ Link wygaśnie za 30 minut
                      </p>
                      <p style="margin: 0 0 12px 0; font-size: 14px; color: #71717a; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                        🛡️ Jeśli nie prosiłeś o reset, zignoruj tę wiadomość
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #52525b; line-height: 1.4; word-break: break-all; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                        Link: <a href="${text}" style="color: #a1a1aa; text-decoration: underline;">${text}</a>
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
              <p style="margin: 0; font-size: 14px; color: #52525b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;">
                © 2025 dajkodzik.pl · Przesyłaj pliki w mgnieniu oka
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;