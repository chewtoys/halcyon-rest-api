import { Request, Response, NextFunction } from 'express';
import { isValidEmailAddress, isValidISODate } from '../utils/string';
import { generateResponse } from '../utils/response';

export interface IValidationOptions {
    [key: string]: IValidationFieldOptions;
}

export interface IValidationFieldOptions {
    type?: 'date' | 'email';
    required?: boolean;
    min?: number;
    max?: number;
    allow?: string[];
}

const validationMiddleware = (fields: IValidationOptions) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!fields) {
        return next();
    }

    const errors: string[] = [];

    for (const [key, options] of Object.entries(fields)) {
        const value = req.body[key] && req.body[key].trim();

        if (options.required && !value) {
            errors.push(`The "${key}" field is required`);
            continue;
        }

        if (options.min && (!value || value.length < options.min)) {
            errors.push(
                `The "${key}" field must be greater than ${
                    options.min
                } characters.`
            );
        }

        if (options.max && (!value || value.length > options.max)) {
            errors.push(
                `The "${key}" field must be less than ${
                    options.max
                } characters.`
            );
        }

        if (options.allow && value && !options.allow.includes(value)) {
            errors.push(
                `The "${key}" field is not a supported type. ${options.allow.join(
                    ', '
                )}`
            );
        }

        if (options.type && value) {
            switch (options.type) {
                case 'email':
                    if (!isValidEmailAddress(value)) {
                        errors.push(
                            `The "${key}" field must be a valid email address.`
                        );
                    }
                    break;
                case 'date':
                    if (!isValidISODate(value)) {
                        errors.push(
                            `The "${key}" field must be a valid ISO date.`
                        );
                    }
                    break;
            }
        }
    }

    if (!errors.length) {
        return next();
    }

    return generateResponse(res, 400, errors);
};

export default validationMiddleware;
