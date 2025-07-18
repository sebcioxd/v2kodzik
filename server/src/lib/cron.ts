import { sql } from "bun"; // można uzyc drizzle

// URUCHOM PLIK Z BUN RUN src/lib/cron.ts

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
       
    } catch (error) {
            console.error('🔴 Wystąpił błąd podczas ustawiania cron jobów:', error);
        }
};

setupCronJob();

