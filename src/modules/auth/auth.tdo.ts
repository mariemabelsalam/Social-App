

import * as validators from './auth.validation'
import { z } from 'zod'

export type ISignupBodyInputsDTto = z.infer<typeof validators.signup.body>
export type IConfirmEmailBodyInputsDTto = z.infer<typeof validators.confirmEmail.body>
export type ILoginBodyInputsDTto = z.infer<typeof validators.login.body>