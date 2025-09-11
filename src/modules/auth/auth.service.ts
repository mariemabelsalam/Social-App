import type { Request, Response } from 'express';
import { UserRepository } from '../../DB/repository/user.repository';
import { emailEvent } from '../../utils/event/email.event';
import { generateNumberOtp } from '../../utils/otp';
import { BadRequestException, ConflictException, NotFoundException } from '../../utils/response/error.response';
import { comapareHash, generateHash } from '../../utils/security/hash.security';
import { UserModel } from './../../DB/models/User.model';
import { IConfirmEmailBodyInputsDTto, ILoginBodyInputsDTto, ISignupBodyInputsDTto } from './auth.tdo';
import { generateToken } from '../../utils/security/token.security';

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
                    userName, email,
                    password: await generateHash(password),
                    confirmEmailOtp: await generateHash(String(otp))
                }]
        })
        emailEvent.emit("confirmEmail", { to: email, otp });
        return res.status(201).json({ message: "done", data: { user } })
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
        return res.status(201).json({ message: "done", data: req.body })
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
        const access_token = await generateToken({
            payload: { _id: user._id }
        })
        const refresh_token = await generateToken({
            payload: { _id: user._id },
            secret: process.env.REFRESH_USER_TOKEN_SIGNATURE as string,
            options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) }
        })
        return res.status(200).json({ message: "done", data: { credentials: { access_token, refresh_token } } })
    }
}

export default new AuthenticationService()