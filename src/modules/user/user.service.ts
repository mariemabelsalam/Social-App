import type { Request, Response } from 'express';
import { ILogoutDto } from './user.tdo';
import { createLoginCredentials, creatreRevokeToken, LogoutEnum } from '../../utils/security/token.security';
import { UpdateQuery } from 'mongoose';
import { HUserDocument, IUser, UserModel } from '../../DB/models/User.model';
import { UserRepository } from '../../DB/repository/user.repository';
import { TokenModel } from '../../DB/models/Token.model';
import { TokenRepository } from '../../DB/repository/token.repository';
import { createPreSignedUploadLink, uploadFile, uploadFiles } from '../../utils/multer/s3.config';
import { storageEnum } from '../../utils/multer/cloud.multer';
import { JwtPayload } from 'jsonwebtoken';
class UserService {
    private userModel = new UserRepository(UserModel);
    private tokenModel = new TokenRepository(TokenModel);
    constructor() { }

    profile = async (req: Request, res: Response): Promise<Response> => {
        return res.json({
            message: "done", data: {
                user: req.user?._id,
                decoded: req.decoded?.iat
            }
        })
    }

    logout = async (req: Request, res: Response): Promise<Response> => {
        const { flag }: ILogoutDto = req.body;
        let statusCode: number = 200
        const update: UpdateQuery<IUser> = {}

        switch (flag) {
            case LogoutEnum.all:
                update.changeCredentialsTime = new Date()
                break;
            default:
                await creatreRevokeToken(req.decoded as JwtPayload)
                statusCode = 201
                break;
        }

        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update
        })
        return res.status(statusCode).json({
            message: "done"
        })
    }

    refreshToken = async (req: Request, res: Response): Promise<Response> => {
        const credentials = await createLoginCredentials(req.user as HUserDocument);
        await creatreRevokeToken(req.decoded as JwtPayload)
        return res.status(201).json({ message: "done", data: { credentials } })
    }

    profileImage = async (req: Request, res: Response): Promise<Response> => {
        const { ContentType, originalname }: { ContentType: string, originalname: string } = req.body
        const { url, Key } = await createPreSignedUploadLink({
            ContentType,
            originalname,
            path: `users/${req.decoded?._id}`
        })
        return res.json({ message: "done", data: { url, Key } })

    }

    profileCoverImage = async (req: Request, res: Response): Promise<Response> => {
        const urls = await uploadFiles({
            storageApproach: storageEnum.disk,
            files: req.files as Express.Multer.File[],
            path: `user/${req.decoded?._id}/cover`
        })
        return res.json({
            message: "done",
            data: {
                urls
            }
        })
    }
}

export default new UserService()