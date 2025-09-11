import { connect } from 'mongoose';
import { UserModel } from './models/User.model';



const connectDB = async (): Promise<void> => {
    try {
        const result = await connect(process.env.URI as string, {
            serverSelectionTimeoutMS: 30000
        })
        await UserModel.syncIndexes();
        console.log('DB connected successfully');

    } catch (error) {
        console.log('fail to connect on DB');

    }
}

export default connectDB