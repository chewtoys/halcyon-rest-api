import { Request, Response } from 'express';
import { wrap } from 'async-middleware';
import handlers from '../handlers';
import validate from '../middleware/validationMiddleware';
import jwt from '../utils/jwt';
import { generateResponse } from '../utils/response';

export interface IGetTokenModel {
    grantType: string;
    emailAddress?: string;
    password?: string;
    provider?: string;
    accessToken?: string;
    verificationCode?: string;
    refreshToken?: string;
}

export interface ITokenModel {
    accessToken?: string;
    refreshToken?: string;
    isLockedOut?: boolean;
    requiresTwoFactor?: boolean;
    requiresExternal?: boolean;
}

export const getToken = [
    validate(['grantType']),
    wrap(async (req: Request, res: Response) => {
        const body = req.body as IGetTokenModel;

        const handler = handlers[body.grantType];
        if (!handler) {
            return generateResponse(res, 400, [
                `Grant Type "${body.provider}" is not supported.`
            ]);
        }

        const result = await handler.authenticate(body);
        if (!result) {
            return generateResponse(res, 400, [
                'The credentials provided were invalid.'
            ]);
        }

        if (result.requiresTwoFactor || result.requiresExternal) {
            return generateResponse<ITokenModel>(res, 400, undefined, result);
        }

        if (result.isLockedOut) {
            return generateResponse(res, 400, [
                'This account has been locked out, please try again later.'
            ]);
        }

        if (!result.user) {
            return generateResponse(res, 400, [
                'The credentials provided were invalid.'
            ]);
        }

        const token = await jwt(result.user);
        return generateResponse<ITokenModel>(res, 200, undefined, token);
    })
];
