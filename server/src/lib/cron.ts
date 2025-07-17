// run this file with bun run src/lib/cron.ts
import { sql } from "bun"; // can also use drizzle

const setupCronJob = async () => {
    try {
        await sql`CREATE EXTENSION IF NOT EXISTS pg_cron;`;
        await sql`CREATE EXTENSION IF NOT EXISTS http;`;
       
        const result = await sql`
            SELECT cron.schedule(
                'shares_cleanup',                    
                '*/5 * * * *',                      
                'DELETE FROM shares WHERE expires_at < NOW();'  
            );
        `;

        console.log('Cleanup cron job scheduled:', result);
        
        const snippetSchedule = await sql`
        SELECT cron.schedule(
            'snippet_cleanup',                    
            '*/5 * * * *',                      
            'DELETE FROM snippets WHERE expires_at < NOW();'  
        );
    `;

        console.log('Snippet cleanup cron job scheduled:', snippetSchedule);
       
        
        const webhookSchedule = await sql`
            SELECT cron.schedule(
                'webhook_cron',                      -- job name
                '0 */6 * * *',                      -- every 6 hours (5 fields: min hour day month dayofweek)
                $$SELECT http_post(
                    'BETTER_AUTH_URL',
                    '{"key": "CRON_BODY_KEY"}',
                    'application/json'
                );$$
            );
        `;
       
        console.log('Webhook cron job scheduled:', webhookSchedule);
       
        const jobs = await sql`SELECT * FROM cron.job;`;
        console.log('All cron jobs:', jobs);
       
} catch (error) {
        console.error('Error setting up cron job:', error);
    }
};

setupCronJob();
export { setupCronJob };