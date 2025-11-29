import { db } from "../db/index";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";


export class multiAccountService {
    constructor() {}

    async getUserAccounts({ ipAddress } : { ipAddress: string | null | undefined }) {
        if (!ipAddress) return;

        const accounts = await db.query.user.findMany({
            where: eq(user.ipAddress, ipAddress),
            with: {
              monthlyLimits: true,
            },
        })

        const allLimits = accounts.flatMap(account => account.monthlyLimits);
        const highestMegabytesUsed = Math.max(0, ...allLimits.map(l => l.megabytesUsed));

        const filteredData = accounts.map(account => {
            if (account.emailVerified) {
                const data = {
                    email: account.email,
                    createdAt: account.createdAt,
                    name: account.name,
                    id: account.id,
                    ipAddress: account.ipAddress,
                    userAgent: account.userAgent,
                    megabytesUsed: account.monthlyLimits.map(account => {
                        return account.megabytesUsed
                    })
                }
                return data
            } 

            return;
        })

        const data = {
            numberOfAccounts: accounts.length,
            highestMegabytesUsed: highestMegabytesUsed,
            accountsData: filteredData,         
        }

        return data;
    }


}

