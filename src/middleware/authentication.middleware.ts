import { NextFunction, Request, Response } from "express"
import { BadRequestException, ForbiddenException } from "../utils/response/error.response"
import { decodedToken, tokenEnum } from "../utils/security/token.security"
import { RoleEnum } from "../DB/models/User.model"
import { GraphQLError } from "graphql"

export const authentication = (tokenType: tokenEnum = tokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            throw new BadRequestException("validation error", {
                key: "headers",
                issues: [{ path: "authorization", message: "missing authorization" }]
            })
        }
        const { decoded, user } = await decodedToken({
            authorization: req.headers.authorization
        })

        req.user = user;
        req.decoded = decoded;
        next()
    }
}




export const authorization = (accessRoles: RoleEnum[] = [], tokenType: tokenEnum = tokenEnum.access) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            throw new BadRequestException("validation error", {
                key: "headers",
                issues: [{ path: "authorization", message: "missing authorization" }]
            })
        }
        const { decoded, user } = await decodedToken({
            authorization: req.headers.authorization,
            tokenType
        })

        if (!accessRoles.includes(user.role)) {
            throw new ForbiddenException("not authorized account")
        }

        req.user = user;
        req.decoded = decoded;
        next()
    }
}



export const graphAuthorization = async (accessRoles: RoleEnum[] = [], role: RoleEnum) => {
    if (!accessRoles.includes(role)) {
        throw new GraphQLError("not auth account", {
            extensions: { statusCode: 403 }
        })
    }
}
