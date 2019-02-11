import { Request, Response } from 'express';
import { generateResponse } from '../utils/response';

const errorMiddleware = (err: any, req: Request, res: Response) =>
    generateResponse(res, err.status || 500, [err.message]);

export default errorMiddleware;
