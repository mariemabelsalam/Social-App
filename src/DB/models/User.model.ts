import { HydratedDocument, model, models, Schema, Types } from "mongoose";
import { emailEvent } from "../../utils/event/email.event";
import { generateHash } from "../../utils/security/hash.security";


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
    slug: string,
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
    friends?: Types.ObjectId[]
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
        slug: {
            type: String,
            required: true,
            minLength: 2,
            maxLength: 51
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
        friends: [{ type: Schema.Types.ObjectId, ref: "User" }]

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

UserSchema.virtual("userName").set(function (value: string) {
    const [firstName, lastName] = value.split(" ") || []
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, '-') })
}).get(function () {
    return this.firstName + ' ' + this.lastName
})

UserSchema.pre("save", async function (this: HUserDocument &
{ wasNew: boolean, confirmEmailPlainOtp?: string }, next) {
    this.wasNew = this.isNew
    if (this.isModified("password")) {
        this.password = await generateHash(this.password)
    }
    if (this.isModified("confirmEmailOtp")) {
        this.confirmEmailPlainOtp = this.confirmEmailOtp as string
        this.confirmEmailOtp = await generateHash(this.confirmEmailOtp as string)
    }
    next()
})

UserSchema.post("save", async function (doc, next) {
    const that = this as HUserDocument & { wasNew: boolean, confirmEmailPlainOtp?: string }
    if (that.wasNew && that.confirmEmailPlainOtp) {
        emailEvent.emit("confirmEmail", { to: this.email, otp: that.confirmEmailPlainOtp })

    }
    next()
})



UserSchema.pre(['find', 'findOne'], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query })
    } else {
        this.setQuery({ ...query, freezedAt: { $exists: false } })
    }

    next()
})


export const UserModel = models.User || model<IUser>("User", UserSchema);
export type HUserDocument = HydratedDocument<IUser>