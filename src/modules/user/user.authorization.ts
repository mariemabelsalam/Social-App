import { RoleEnum } from "../../DB/models/User.model";


export const endPoint = {
    profile: [RoleEnum.user],
    welcome: [RoleEnum.user, RoleEnum.admin],
}