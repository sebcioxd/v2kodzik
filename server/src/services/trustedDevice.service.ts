import { db } from "../db/index";
import { trustedDevice } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export class trustedDeviceService {
    constructor() {}

    async checkDevice({ referenceId, ipAddress, userAgent }: 
    {  referenceId: string | null, ipAddress: string, userAgent: string | null | undefined }) 
    {

        if (!referenceId) return;

        const devices = await db.select().from(trustedDevice).where(eq(trustedDevice.userId, referenceId));

        if (!devices || devices.length === 0) {
            return {
                isTrustedDevice: false,
                device: null
            };
        }
 
        const matchedDevice = devices.find(device => {
            return device.ipAddress === ipAddress && device.userAgent?.toLowerCase() === userAgent?.toLowerCase();
        });

        return {
            isTrusted: !!matchedDevice,
            deviceId: matchedDevice?.id
        };
    }

    async extendExpireDateOfDevice({ deviceId }: { deviceId: string | undefined}) {
        if (!deviceId) return;

        await db.update(trustedDevice).set({
            expiresAt: sql`NOW() + INTERVAL '1 month'`
        }).where(eq(trustedDevice.id, deviceId))
    }

    async addDevice({ referenceId, ipAddress, userAgent }: 
        {  referenceId: string | undefined | null, ipAddress: string, userAgent: string | null | undefined }) 
        {
            if (!referenceId) return;
            await db.insert(trustedDevice).values({
                userId: referenceId,
                ipAddress: ipAddress,
                userAgent: userAgent
            })
    }

    async listDevices({ referenceId, userAgent, ipAddress }: { referenceId: string, userAgent: string | undefined, ipAddress: string }) {
        const devices = await db.select().from(trustedDevice).where(eq(trustedDevice.userId, referenceId)); 

        const devicesData = devices.map(device => ({
            ...device,
            isCurrentDevice: (
                device.ipAddress === ipAddress && 
                device.userAgent?.toLowerCase() === userAgent?.toLowerCase()
            )
        }));

        return devicesData;
    }

    async removeDevice({ deviceId }: { deviceId: string }) {

        await db.delete(trustedDevice).where(eq(trustedDevice.id, deviceId))

    }


}

