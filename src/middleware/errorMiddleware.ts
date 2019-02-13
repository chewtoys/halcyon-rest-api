import { Request, Response, NextFunction } from 'express';
import { generateResponse } from '../utils/response';

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.log('BANG!!!!', err);

    if (err.message === 'UnauthorizedError') {
        return generateResponse(res, 401, ['The token provided was invalid.']);
    }

    if (err.message === 'UnauthorizedError') {
        return generateResponse(res, 403, [
            'You are not authorized to view this resource.'
        ]);
    }

    return generateResponse(res, err.status || 500, [err.message]);
};

export default errorMiddleware;
