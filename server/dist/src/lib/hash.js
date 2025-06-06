import bcrypt from "bcryptjs";
export const hashCode = async (code) => {
    return await bcrypt.hash(code, 10);
};
export const verifyCode = async (code, hashedCode) => {
    return await bcrypt.compare(code, hashedCode);
};
