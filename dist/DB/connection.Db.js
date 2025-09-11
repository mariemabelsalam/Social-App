"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_model_1 = require("./models/User.model");
const connectDB = async () => {
    try {
        const result = await (0, mongoose_1.connect)(process.env.URI, {
            serverSelectionTimeoutMS: 30000
        });
        await User_model_1.UserModel.syncIndexes();
        console.log('DB connected successfully');
    }
    catch (error) {
        console.log('fail to connect on DB');
    }
};
exports.default = connectDB;
