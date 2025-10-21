import { Server } from "socket.io";
import { IAuthSocket } from "../getway";



export interface IMainDTO {
    socket: IAuthSocket;
    callBack?: any;
    io?: Server
}



export interface ISayHelloDTO extends IMainDTO {
    message: string;

}