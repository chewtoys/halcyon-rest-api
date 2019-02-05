import { IUserModel } from '../models/user';
import * as password from './password';
import * as refreshToken from './refreshToken';
import * as external from './external';
import * as twoFactor from './twoFactor';

export interface IHandlerRequest {
    emailAddress: string;
    password: string;
    refreshToken: string;
    provider: string;
    accessToken: string;
    verificationCode: string;
}

export interface IHandlerResponse {
    requiresTwoFactor?: boolean;
    requiresExternal?: boolean;
    isLockedOut?: boolean;
    user?: IUserModel;
}

export interface IHandler {
    authenticate: (model: IHandlerRequest) => Promise<IHandlerResponse>;
}

export interface IHandlers {
    [index: string]: IHandler;
}

const handlers: IHandlers = {
    Password: password,
    RefreshToken: refreshToken,
    External: external,
    TwoFactor: twoFactor
};

export default handlers;
