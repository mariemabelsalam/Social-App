import type { Request, Response } from 'express';
import { emailEvent } from '../../utils/event/email.event';
import { generateNumberOtp } from '../../utils/otp';
import { BadRequestException, ConflictException, NotFoundException } from '../../utils/response/error.response';
import { comapareHash } from '../../utils/security/hash.security';
import { createLoginCredentials } from '../../utils/security/token.security';
import { UserModel } from './../../DB/models/User.model';
import { UserRepository } from './../../DB/repository/user.repository';
import { IConfirmEmailBodyInputsDTto, ILoginBodyInputsDTto, ISignupBodyInputsDTto } from './auth.tdo';
import { successResponse } from '../../utils/response/success.response';
import { ILoginResponse } from './auth.entities';

class AuthenticationService {
    private UserModel = new UserRepository(UserModel)

    constructor() { }
    signup = async (req: Request, res: Response): Promise<Response> => {
        let { userName, email, password }: ISignupBodyInputsDTto = req.body
        const CheckUserExist = await this.UserModel.findOne({
            filter: { email },
            select: "email",
            options: { lean: true }
        })
        if (CheckUserExist) {
            throw new ConflictException("email axist")
        }
        const otp = generateNumberOtp()
        const user = await this.UserModel.createUser({
            data:
                [{
                    userName,
                    email,
                    password,
                    confirmEmailOtp: `${otp}`
                }]
        })
        emailEvent.emit("confirmEmail", { to: email, otp });
        return successResponse({ res, statusCode: 201, })
    }

    confirmEmail = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp }: IConfirmEmailBodyInputsDTto = req.body;
        const user = await this.UserModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false }
            }
        })
        if (!user) {
            throw new NotFoundException("invalid account")
        }
        if (!await comapareHash(otp, user.confirmEmailOtp as string)) {
            throw new ConflictException("invalid code")
        }
        await this.UserModel.updateOne({
            filter: { email },
            update: {
                confirmedAt: new Date(),
                $unset: { confirmEmailOtp: 1 }
            }
        })
        return successResponse({res,statusCode:201,data:req.body})
    }

    login = async (req: Request, res: Response): Promise<Response> => {
        const { email, password }: ILoginBodyInputsDTto = req.body;
        const user = await this.UserModel.findOne({
            filter: { email }
        })
        if (!user) {
            throw new NotFoundException("invalid email or password")
        }
        if (!user.confirmedAt) {
            throw new BadRequestException("verify your account first");
        }
        if (!await comapareHash(password, user.password)) {
            throw new NotFoundException("invalid email or password")
        }
        const credentials = await createLoginCredentials(user)

        return successResponse<ILoginResponse>({ res, data: { credentials } })
    }
}

export default new AuthenticationService()