import type { Request, Response } from 'express';
import { GraphQLError } from 'graphql';
import { JwtPayload } from 'jsonwebtoken';
import { UpdateQuery } from 'mongoose';
import { TokenModel } from '../../DB/models/Token.model';
import { GenderEnum, HUserDocument, UserModel } from '../../DB/models/User.model';
import { TokenRepository } from '../../DB/repository/token.repository';
import { UserRepository } from '../../DB/repository/user.repository';
import { storageEnum } from '../../utils/multer/cloud.multer';
import { createPreSignedUploadLink, uploadFiles } from '../../utils/multer/s3.config';
import { BadRequestException, NotFoundException } from '../../utils/response/error.response';
import { successResponse } from '../../utils/response/success.response';
import { comapareHash, generateHash } from '../../utils/security/hash.security';
import { createLoginCredentials, creatreRevokeToken, LogoutEnum } from '../../utils/security/token.security';
import { ILogoutDto } from './user.tdo';


export interface IUser {
    id: number;
    name: string;
    email: string;
    password: string;
    gender: GenderEnum
    followers: number[]
}

let users: IUser[] = [
    {
        id: 1,
        name: 'mariem',
        email: 'mariem@gmail.com',
        gender: GenderEnum.female,
        password: "12dkd",
        followers: []
    },
    {
        id: 2,
        name: 'youssef',
        email: 'youssef@gmail.com',
        gender: GenderEnum.male,
        password: "12dkd",
        followers: []
    },
    {
        id: 2,
        name: 'dina',
        email: 'dina@gmail.com',
        gender: GenderEnum.female,
        password: "12dkd",
        followers: []
    },
    {
        id: 4,
        name: 'marwan',
        email: 'marwan@gmail.com',
        gender: GenderEnum.male,
        password: "12dkd",
        followers: []
    },
    {
        id: 5,
        name: 'omar',
        email: 'omar@gmail.com',
        gender: GenderEnum.male,
        password: "12dkd",
        followers: []
    },
    {
        id: 6,
        name: 'eman',
        email: 'eman@gmail.com',
        gender: GenderEnum.female,
        password: "12dkd",
        followers: []
    },
];


export class UserService {
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

    updatePassword = async (req: Request, res: Response): Promise<Response> => {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            throw new BadRequestException("Old and new password are required");
        }
        const user = await this.userModel.findOne({
            filter: { _id: req.decoded?._id }
        });
        if (!user) {
            throw new NotFoundException("User not found");
        }
        const isMatch = await comapareHash(oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException("Invalid old password");
        }


        const hashedPassword = await generateHash(newPassword);
        await this.userModel.updateOne({
            filter: { _id: user._id },
            update: { password: hashedPassword }
        });

        return successResponse({
            res,
            message: "Password updated successfully",
            statusCode: 200
        });
    }

    welcome = (user: HUserDocument): string => {
        return "hello graphql"
    }

    allUsers = async (args: { gender: GenderEnum }, authUser: HUserDocument): Promise<HUserDocument[]> => {
        return await this.userModel.find({
            filter: {
                _id: { $ne: authUser._id },
                gender: args.gender
            }
        })
    }

    search = (args: { email: string }): { message: string, statusCode: number, data: IUser } => {
        const user = users.find((user) => user.email === args.email)
        if (!user) {
            throw new GraphQLError("fail to find matching result", {
                extensions: { statusCode: 404 }
            })
        }
        return { message: "done", statusCode: 200, data: user }
    }

    addFollowers = (args: { friendId: number, myId: number }): IUser[] => {
        users = users.map((user: IUser): IUser => {
            if (user.id == args.friendId) {
                user.followers.push(args.myId)
            }
            return user
        })
        return users;
    }
}

export default new UserService()



