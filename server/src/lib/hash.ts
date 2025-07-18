export const hashCode = async (code: string) => {
    return await Bun.password.hash(code, {
        algorithm: "bcrypt",
        cost: 4,
    })
}

export const verifyCode = async (code: string, hashedCode: string) => {
    return await Bun.password.verify(code, hashedCode);
}
