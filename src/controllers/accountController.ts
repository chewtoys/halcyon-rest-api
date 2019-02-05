import { Request, Response } from 'express';
import uuidv4 from 'uuid/v4';
import * as repository from '../repositories/userRepository';
import providers from '../providers';
import * as password from '../utils/password';
import * as email from '../utils/email';
import { validators } from '../utils/validators';
import { generateResponse, validationMiddleware } from '../utils/express';

export const register = [
    validationMiddleware({
        emailAddress: validators.emailAddress,
        password: validators.password,
        firstName: validators.firstName,
        lastName: validators.lastName,
        dateOfBirth: validators.dateOfBirth
    }),
    async (req: Request, res: Response) => {
        const existing = await repository.getUserByEmailAddress(
            req.body.emailAddress
        );

        if (existing) {
            return generateResponse(res, 400, [
                `User name "${req.body.emailAddress}" is already taken.`
            ]);
        }

        const user = {
            emailAddress: req.body.emailAddress,
            password: await password.hash(req.body.password),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dateOfBirth: req.body.dateOfBirth,
            verifyEmailToken: uuidv4()
        };

        await repository.createUser(user);

        await email.send({
            to: user.emailAddress,
            template: 'verifyEmail',
            context: {
                code: user.verifyEmailToken
            }
        });

        return generateResponse(res, 200, ['User successfully registered.']);
    }
];

export const registerExternal = [
    validationMiddleware({
        provider: validators.provider,
        accessToken: validators.accessToken,
        emailAddress: validators.emailAddress,
        firstName: validators.firstName,
        lastName: validators.lastName,
        dateOfBirth: validators.dateOfBirth
    }),
    async (req: Request, res: Response) => {
        const provider = providers[req.body.provider];
        if (!provider) {
            return generateResponse(res, 400, [
                `Provider "${req.body.provider}" is not supported.`
            ]);
        }

        const externalUser = await provider.getUser(req.body.accessToken);
        if (!externalUser) {
            return generateResponse(res, 400, [
                'The credentials provided were invalid.'
            ]);
        }

        let existing = await repository.getUserByEmailAddress(
            req.body.emailAddress
        );

        if (existing) {
            return generateResponse(res, 400, [
                `User name "${req.body.emailAddress}" is already taken.`
            ]);
        }

        existing = await repository.getUserByLogin(
            req.body.provider,
            externalUser.userId
        );

        if (existing) {
            return generateResponse(res, 400, [
                'A user with this login already exists.'
            ]);
        }

        const user = {
            emailAddress: req.body.emailAddress,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dateOfBirth: req.body.dateOfBirth,
            logins: [
                {
                    provider: req.body.provider,
                    externalId: externalUser.userId
                }
            ]
        };

        await repository.createUser(user);

        return generateResponse(res, 200, ['User successfully registered.']);
    }
];

export const forgotPassword = [
    validationMiddleware({
        emailAddress: validators.emailAddress
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserByEmailAddress(
            req.body.emailAddress
        );

        if (user) {
            user.passwordResetToken = uuidv4();
            await repository.updateUser(user);

            await email.send({
                to: user.emailAddress,
                template: 'resetPassword',
                context: {
                    code: user.passwordResetToken
                }
            });
        }

        return generateResponse(res, 200, [
            'Instructions as to how to reset your password have been sent to you via email.'
        ]);
    }
];

export const resetPassword = [
    validationMiddleware({
        code: validators.code,
        emailAddress: validators.emailAddress,
        newPassword: validators.newPassword
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserByEmailAddress(
            req.body.emailAddress
        );

        if (!user || user.passwordResetToken !== req.body.code) {
            return generateResponse(res, 400, ['Invalid token.']);
        }

        user.password = await password.hash(req.body.newPassword);
        user.passwordResetToken = undefined;
        user.twoFactorEnabled = undefined;
        user.twoFactorSecret = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your password has been reset.']);
    }
];
