import { Response } from 'express';

export const generateResponse = <T = undefined>(
    res: Response,
    status: number,
    messages: string[],
    data?: T
) =>
    res.status(status).json({
        messages,
        data
    });
