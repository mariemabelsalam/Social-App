import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { decodedToken, tokenEnum } from '../../utils/security/token.security';
import { IAuthSocket } from './getway.interface';
import { ChatGetway } from '../chat';
import { BadRequestException } from '../../utils/response/error.response';


export const connectedSockets = new Map<string, string[]>()

let io: undefined | Server = undefined
export const initializeIo = (httpServer: HttpServer) => {


    io = new Server(httpServer, {
        cors: {
            origin: "*"
        }
    })

    io.use(async (socket: IAuthSocket, next) => {
        try {
            const { user, decoded } = await decodedToken({
                authorization: socket.handshake?.auth.authorization || '',
                tokenType: tokenEnum.access
            })
            const userTaps = connectedSockets.get(user._id.toString()) || [];
            userTaps.push(socket.id)
            connectedSockets.set(user._id.toString(), userTaps)
            io?.emit("online_user", user._id.toString())
            socket.credentials = { user, decoded }
            next()
        } catch (error: any) {
            next(error)
        }
    })


    function disconnection(socket: IAuthSocket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString() as string
            let remainingTaps =
                connectedSockets.get(userId)?.filter((tab: string) => {
                    return tab !== socket.id
                })

            if (remainingTaps?.length) {
                connectedSockets.set(userId, remainingTaps)
            }
            else {
                connectedSockets.delete(userId)
                getIo().emit("offline_user", userId)
            }

            console.log(`logout from ${socket.id}`);
            console.log({ after_Disconnect: connectedSockets });
        })
    }


    const chatgetway: ChatGetway = new ChatGetway()
    getIo().on("connection", (socket: IAuthSocket) => {
        chatgetway.register(socket, getIo())
        disconnection(socket)
    })
}


export const getIo = (): Server => {
    if (!io) {
        throw new BadRequestException("fail to stablish server socket io")
    }
    return io
}