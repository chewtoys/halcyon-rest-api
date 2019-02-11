import { Request, Response, NextFunction } from 'express';
import { generateResponse } from '../utils/response';
import { validateSchema } from '../utils/validators';

const validationMiddleware = (requestSchema: {}) => (
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

export default validationMiddleware;
