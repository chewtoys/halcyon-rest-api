import { Request, Response, NextFunction, RequestHandler } from 'express';

const asyncMiddleware = (handler: RequestHandler) => async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        next(error);
    }
};

export default asyncMiddleware;
