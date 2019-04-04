import crypto from 'crypto';
import { Document, Schema, Model, model, models } from 'mongoose';

export interface IUser {
    emailAddress: string;
    password?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passwordResetToken?: string;
    verifyEmailToken?: string;
    roles?: string[];
    emailConfirmed?: boolean;
    isLockedOut?: boolean;
    twoFactorEnabled?: boolean;
    twoFactorSecret?: string;
    twoFactorTempSecret?: string;
    refreshTokens?: IUserRefreshToken[];
    logins?: IUserLogin[];
}

export interface IUserLogin {
    provider: 'Facebook' | 'Google';
    externalId: string;
}

export interface IUserRefreshToken {
    token: string;
    issued: Date;
}

export interface IUserModel extends IUser, Document {
    hasPassword?: boolean;
    picture?: string;
}

export const UserSchema: Schema = new Schema({
    emailAddress: { type: String, required: true, max: 254, unique: true },
    password: { type: String, max: 128 },
    firstName: { type: String, required: true, max: 50 },
    lastName: { type: String, required: true, max: 50 },
    dateOfBirth: { type: Date, required: true },
    passwordResetToken: { type: String, max: 36 },
    verifyEmailToken: { type: String, max: 36 },
    roles: { type: [String] },
    emailConfirmed: { type: Boolean },
    isLockedOut: { type: Boolean },
    twoFactorEnabled: { type: Boolean },
    twoFactorSecret: { type: String, max: 16 },
    twoFactorTempSecret: { type: String, max: 16 },
    refreshTokens: [
        {
            token: { type: String, required: true, max: 36 },
            issued: { type: Date, required: true }
        }
    ],
    logins: [
        {
            provider: { type: String, required: true, max: 50 },
            externalId: { type: String, required: true, max: 50 }
        }
    ]
});

UserSchema.virtual('hasPassword').get(function() {
    return !!this.password;
});

UserSchema.virtual('picture').get(function() {
    const hash = crypto
        .createHash('md5')
        .update(this.emailAddress)
        .digest('hex');

    return `https://secure.gravatar.com/avatar/${hash}?d=mm`;
});

UserSchema.index({ '$**': 'text' });

export default (models.User as Model<IUserModel>) ||
    model<IUserModel>('User', UserSchema);
