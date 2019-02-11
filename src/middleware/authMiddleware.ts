import { Request, Response, NextFunction } from 'express';
import jsonWebToken from 'jsonwebtoken';
import config from '../utils/config';
import { generateResponse } from '../utils/response';

export interface IJwtPayload {
    sub: string;
    role: string;
}

const authMiddleware = (requiredRoles?: string[]) => async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token =
        req.headers.authorization &&
        req.headers.authorization.replace(/bearer /giu, '');

    if (!token) {
        return generateResponse(res, 401, ['The token provided was invalid.']);
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
        return generateResponse(res, 401, ['The token provided was invalid.']);
    }

    res.locals.userId = payload.sub;

    if (!requiredRoles) {
        return next();
    }

    if (
        !payload.role ||
        !requiredRoles.some(value => payload.role.includes(value))
    ) {
        return generateResponse(res, 403, [
            'You are not authorized to view this resource.'
        ]);
    }

    return next();
};

export default authMiddleware;
