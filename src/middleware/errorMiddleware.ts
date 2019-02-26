import { Request, Response, NextFunction } from 'express';
import { generateResponse } from '../utils/response';

const errorMiddleware = (
    err: any,
    _: Request,
    res: Response,
    __: NextFunction
) => generateResponse(res, err.status || 500, [err.message]);

export default errorMiddleware;
