import bcrypt from "bcryptjs";

export const hashCode = async (code: string) => {
    return await bcrypt.hash(code, 4);
}

export const verifyCode = async (code: string, hashedCode: string) => {
    return await bcrypt.compare(code, hashedCode);
}
