import { sql } from "bun"; 

/* 
** TO JEST FUNKCJA JEŚLI MACIE MOŻLIWOŚĆ UŻYWANIA pg-cron, więcej inforamcji w /pg_image/guide.md
** NIE JEST TO ZASTĄPIENIE TRADYCYJNEGO /v1/cron, TYLKO JEGO WSPOMAGACZ
** URUCHOM PLIK Z BUN RUN src/lib/pg-cron.ts
** ZMIANY POWINNY ZOSTAĆ WPROWADZONE DO BAZY
*/


const setupCronJob = async () => {
    try {
        await sql`CREATE EXTENSION IF NOT EXISTS pg_cron;`;

        const result = await sql`
            SELECT cron.schedule(
                'shares_cleanup',                    
                '*/5 * * * *',                      
                'DELETE FROM shares WHERE expires_at < NOW();'  
            );
        `;
        console.log('🟢 Shares cron pomyślnie ustawiony', result);
       
        const snippetSchedule = await sql`
            SELECT cron.schedule(
                'snippet_cleanup',                    
                '*/5 * * * *',                      
                'DELETE FROM snippets WHERE expires_at < NOW();'  
            );
        `;
        console.log('🟢 Snippet cleanup cron pomyślnie ustawiony', snippetSchedule);

        const signatureSchedule = await sql`
            SELECT cron.schedule(
                'signature_cleanup',                    
                '*/5 * * * *',                      
                'DELETE FROM signatures WHERE expires_at < NOW();'  
            );
        `;
        console.log('🟢 Signature cleanup cron pomyślnie ustawiony', signatureSchedule);

        const cancelSignatureSchedule = await sql`
            SELECT cron.schedule(
                'cancel_signature_cleanup',                    
                '*/5 * * * *',                      
                'DELETE FROM cancel_signatures WHERE expires_at < NOW();'   
            );
        `;
        console.log('🟢 Cancel signature cleanup cron pomyślnie ustawiony', cancelSignatureSchedule);

        const monthlyLimitsCleanup = await sql`
            SELECT cron.schedule(
                'monthly_limits_cleanup',                    
                '*/5 * * * *',                      
                'UPDATE monthly_limits SET megabytes_used = 0, reset_at = NOW() + INTERVAL ''1 month'' WHERE reset_at < NOW();'  
            );
        `;
        console.log('🟢 Monthly limits cleanup cron pomyślnie ustawiony', monthlyLimitsCleanup);

        const monthlyIPLimitsCleanup = await sql`
            SELECT cron.schedule(
                'monthly_ip_limits_cleanup',                    
                '*/5 * * * *',                      
                'UPDATE monthly_ip_limits SET megabytes_used = 0, reset_at = NOW() + INTERVAL ''1 month'' WHERE reset_at < NOW();'  
            );
        `;
        console.log('🟢 Monthly IP limits cleanup cron pomyślnie ustawiony', monthlyIPLimitsCleanup);

        
        const twoFactorCleanup = await sql`
            SELECT cron.schedule(
                'two_factor_cleanup',                    
                '*/5 * * * *',                      
                'DELETE FROM two_factor WHERE created_at < NOW() - INTERVAL ''10 minutes'';'  
            );
        `;
        console.log('🟢 Two factor cleanup cron pomyślnie ustawiony', twoFactorCleanup);

        const trustedDevicesCleanup = await sql`
        SELECT cron.schedule(
            'trusted_devices_limits_cleanup',                    
            '*/5 * * * *',                      
            'DELETE FROM trusted_device WHERE expires_at < NOW()'  
        );
        `;
        console.log('🟢 Trusted devices cleanup cron pomyślnie ustawiony', trustedDevicesCleanup);


    } catch (error) {
            console.error('🔴 Wystąpił błąd podczas ustawiania cron jobów:', error);
        }
};

setupCronJob();