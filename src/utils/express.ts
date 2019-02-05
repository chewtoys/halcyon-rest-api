import { Request, Response, NextFunction } from 'express';
import { validateSchema } from './validators';

export const errorMiddleware = (err: any, req: Request, res: Response) =>
    generateResponse(res, err.status || 500, [err.message]);

export const notFoundMiddleware = (req: Request, res: Response) =>
    generateResponse(res, 404, ['Resource not found.']);

export const validationMiddleware = (requestSchema: {}) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validateSchema(req.body, requestSchema);
    if (errors) {
        return generateResponse(res, 400, errors);
    }

    return next();
};

export const generateResponse = (
    res: Response,
    status: number,
    messages: string[],
    data?: any
) =>
    res.status(status).json({
        messages,
        data
    });
