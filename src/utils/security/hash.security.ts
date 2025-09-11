
import { compare, hash } from 'bcrypt'

export const generateHash = async (
    plainText: string, saltRound: number = Number(process.env.SALT)
): Promise<string> => {
    return await hash(plainText, saltRound)
}


export const comapareHash = async (
    plainText: string, hash: string
): Promise<boolean> => {
    return await compare(plainText, hash)
} 