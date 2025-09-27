export const dataRequestTemplate = (customerName: string) => {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Twoje dane - dajkodzik.pl</title>
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
                        Twoje dane
                      </h1>
                      <p style="margin: 0; font-size: 16px; color: #a1a1aa; font-weight: 400;">
                        Oto kompletne dane z Twojego konta
                      </p>
                    </td>
                  </tr>

                  <!-- Data Details Section -->
                  <tr>
                    <td style="padding: 32px;">
                      <div style="margin: 0 0 24px 0;">
                        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #f4f4f5;">
                          Informacje o danych
                        </h2>
                        
                        <!-- Data Info -->
                        <div style="margin: 0 0 16px 0; padding: 16px; background-color: #09090b; border: 1px solid #27272a; border-radius: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin: 0 0 8px 0;">
                            <span style="font-size: 16px; color: #d4d4d8; font-weight: 500;">Nazwa użytkownika: </span>
                            <span style="font-size: 16px; color: #f4f4f5; font-weight: 600;"> ${customerName}</span>
                          </div>
                          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #27272a;">
                            <span style="font-size: 16px; color: #d4d4d8; font-weight: 500;">Data wygenerowania: </span>
                            <span style="font-size: 16px; color: #f4f4f5; font-weight: 600;"> ${new Date().toLocaleDateString('pl-PL')}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Data Description -->
                      <div style="margin: 0 0 24px 0; padding: 20px; background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; text-align: center;">
                        <p style="margin: 0 0 12px 0; font-size: 16px; color: #d4d4d8; line-height: 1.5;">
                          📄 Twoje dane zostały wyeksportowane do pliku JSON
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">
                          Plik zawiera wszystkie informacje związane z Twoim kontem, w tym historię plików, ustawienia i subskrypcję.
                        </p>
                      </div>

                      <!-- What's Included -->
                      <div style="margin: 0 0 24px 0; padding: 16px; background-color: #09090b; border: 1px solid #27272a; border-radius: 8px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #f4f4f5;">
                          Co zawiera eksport?
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                          <li style="margin: 0 0 8px 0;">Podstawowe informacje o koncie użytkownika</li>
                          <li style="margin: 0 0 8px 0;">Historia przesłanych plików i snippetów</li>
                          <li style="margin: 0 0 8px 0;">Informacje o subskrypcji i płatnościach</li>
                          <li style="margin: 0 0 8px 0;">Ustawienia konta i preferencje</li>
                          <li style="margin: 0;">Dane o udostępnianych plikach</li>
                        </ul>
                      </div>

                      <!-- Security Notice -->
                      <div style="margin: 24px 0 0 0; padding: 16px; background-color: #09090b; border: 1px solid #27272a; border-radius: 6px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a; line-height: 1.4;">
                          🔒 Plik zawiera wrażliwe dane - przechowuj go bezpiecznie
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #71717a; line-height: 1.4;">
                          📧 Jeśli nie prosiłeś o te dane, skontaktuj się z nami: <a href="mailto:support@dajkodzik.pl" style="color: #d4d4d8; text-decoration: underline;">support@dajkodzik.pl</a>
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
</html>`;
};
