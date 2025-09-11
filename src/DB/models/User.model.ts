import { model, models, Schema } from "mongoose";


export enum GenderEnum {
    male = "male",
    female = "female"
}

export enum RoleEnum {
    user = "user",
    admin = "admin"
}

export interface IUser {
    firstName: string;
    lastName: string;
    userName?: string;
    email: string;
    confirmEmailOtp?: string;
    confirmedAt?: Date
    password: string;
    resetPasswordOtp?: string;
    changeCredentialsTime?: Date
    phone?: string;
    address?: string;
    gender: GenderEnum;
    role: RoleEnum;
    createdAt: Date;
    updatedAt?: Date
}

const UserSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 20
        },
        lastName: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 20
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        gender: {
            type: String,
            enum: GenderEnum,
            default: GenderEnum.male
        },
        role: {
            type: String,
            enum: RoleEnum,
            default: RoleEnum.user
        },
        confirmEmailOtp: { type: String },
        confirmedAt: { type: Date },
        resetPasswordOtp: { type: String },
        changeCredentialsTime: { type: Date },
        phone: { type: String },
        address: { type: String },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

UserSchema.virtual("userName").set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || []
    this.set({ firstName, lastName })
}).get(function () {
    return this.firstName + ' ' + this.lastName
})

export const UserModel = models.User || model<IUser>("User", UserSchema)