import { Request, Response, NextFunction } from 'express';
import { wrap } from 'async-middleware';
import jsonWebToken from 'jsonwebtoken';
import config from '../utils/config';

export interface IJwtPayload {
    sub: string;
    role: string;
}

const authMiddleware = (requiredRoles?: string[]) =>
    wrap(async (req: Request, res: Response, next: NextFunction) => {
        const token =
            req.headers.authorization &&
            req.headers.authorization.replace(/bearer /giu, '');

        if (!token) {
            throw Error('UnauthorizedError');
        }

        let payload: IJwtPayload;
        try {
            payload = (await jsonWebToken.verify(
                token,
                config.JWT_SECURITYKEY
            )) as IJwtPayload;
        } catch (error) {
            console.error('Verify Token Failed', error);
        }

        if (!payload) {
            throw Error('UnauthorizedError');
        }

        res.locals.userId = payload.sub;

        if (!requiredRoles) {
            return next();
        }

        if (
            !payload.role ||
            !requiredRoles.some(value => payload.role.includes(value))
        ) {
            throw Error('PermissionDeniedError');
        }

        return next();
    });

export default authMiddleware;
