import { Request, Response } from 'express';
import handlers from '../handlers';
import validate from '../middleware/validationMiddleware';
import jwt from '../utils/jwt';
import { validators } from '../utils/validators';
import { generateResponse } from '../utils/response';

export const getToken = [
    validate({ grantType: validators.grantType }),
    async (req: Request, res: Response) => {
        const handler = handlers[req.body.grantType];
        if (!handler) {
            return generateResponse(res, 400, [
                `Grant Type "${req.body.provider}" is not supported.`
            ]);
        }

        const result = await handler.authenticate(req.body);
        if (!result) {
            return generateResponse(res, 400, [
                'The credentials provided were invalid.'
            ]);
        }

        if (result.requiresTwoFactor || result.requiresExternal) {
            return generateResponse(res, 400, undefined, result);
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
        return generateResponse(res, 200, undefined, token);
    }
];
