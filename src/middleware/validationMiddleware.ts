import { Request, Response, NextFunction } from 'express';
import { generateResponse } from '../utils/response';
import { validateFields } from '../utils/validators';

const validationMiddleware = (fields: string[]) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validateFields(req.body, fields);
    if (errors) {
        return generateResponse(res, 400, errors);
    }

    return next();
};

export default validationMiddleware;
