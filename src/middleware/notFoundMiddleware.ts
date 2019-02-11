import { Request, Response } from 'express';
import { generateResponse } from '../utils/response';

const notFoundMiddleware = (req: Request, res: Response) =>
    generateResponse(res, 404, ['Resource not found.']);

export default notFoundMiddleware;
