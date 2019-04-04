import { IUserModel } from '../models/user';
import { Provider } from '../providers';
import * as password from './password';
import * as refreshToken from './refreshToken';
import * as external from './external';
import * as twoFactor from './twoFactor';

export type GrantType = 'Password' | 'RefreshToken' | 'External' | 'TwoFactor';

export interface IHandlerRequest {
    emailAddress?: string;
    password?: string;
    refreshToken?: string;
    provider?: Provider;
    accessToken?: string;
    verificationCode?: string;
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
