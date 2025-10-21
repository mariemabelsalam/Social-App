import { Socket } from "socket.io";
import { HUserDocument } from "../../DB/models";
import { JwtPayload } from "jsonwebtoken";

export interface IAuthSocket extends Socket {
    credentials?: {
        user: Partial<HUserDocument>,
        decoded: JwtPayload,
    }
}
