import { LogoutEnum } from './../../utils/security/token.security';
import { z } from 'zod';


export const logout = {
    body: z.strictObject({
        flag: z.enum(LogoutEnum).default(LogoutEnum.only)
    })
}

export const welcome = z.strictObject({
    name: z.string().min(2)
})

