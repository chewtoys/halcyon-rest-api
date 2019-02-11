import { Response } from 'express';

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
