import { Request, Response } from 'express';
import { wrap } from 'async-middleware';
import uuidv4 from 'uuid/v4';
import * as repository from '../repositories/userRepository';
import { IBaseProfileModel } from './manageController';
import providers from '../providers';
import validate from '../middleware/validationMiddleware';
import * as password from '../utils/password';
import * as email from '../utils/email';
import { validators } from '../utils/validators';
import { generateResponse } from '../utils/response';

export interface IRegisterModel extends IBaseProfileModel {
    password: string;
}

export interface IRegisterExternalModel extends IBaseProfileModel {
    provider: string;
    accessToken: string;
}

export interface IForgotPasswordModel {
    emailAddress: string;
}

export interface IResetPasswordModel {
    code: string;
    emailAddress: string;
    newPassword: string;
}

export const register = [
    validate({
        emailAddress: validators.emailAddress,
        password: validators.password,
        firstName: validators.firstName,
        lastName: validators.lastName,
        dateOfBirth: validators.dateOfBirth
    }),
    wrap(async (req: Request, res: Response) => {
        const body = req.body as IRegisterModel;

        const existing = await repository.getUserByEmailAddress(
            body.emailAddress
        );

        if (existing) {
            return generateResponse(res, 400, [
                `User name "${body.emailAddress}" is already taken.`
            ]);
        }

        const user = {
            emailAddress: body.emailAddress,
            password: await password.hash(body.password),
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: body.dateOfBirth,
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
    })
];

export const registerExternal = [
    validate({
        provider: validators.provider,
        accessToken: validators.accessToken,
        emailAddress: validators.emailAddress,
        firstName: validators.firstName,
        lastName: validators.lastName,
        dateOfBirth: validators.dateOfBirth
    }),
    wrap(async (req: Request, res: Response) => {
        const body = req.body as IRegisterExternalModel;

        const provider = providers[body.provider];
        if (!provider) {
            return generateResponse(res, 400, [
                `Provider "${body.provider}" is not supported.`
            ]);
        }

        const externalUser = await provider.getUser(body.accessToken);
        if (!externalUser) {
            return generateResponse(res, 400, [
                'The credentials provided were invalid.'
            ]);
        }

        let existing = await repository.getUserByEmailAddress(
            body.emailAddress
        );

        if (existing) {
            return generateResponse(res, 400, [
                `User name "${body.emailAddress}" is already taken.`
            ]);
        }

        existing = await repository.getUserByLogin(
            body.provider,
            externalUser.userId
        );

        if (existing) {
            return generateResponse(res, 400, [
                'A user with this login already exists.'
            ]);
        }

        const user = {
            emailAddress: body.emailAddress,
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: body.dateOfBirth,
            logins: [
                {
                    provider: body.provider,
                    externalId: externalUser.userId
                }
            ]
        };

        await repository.createUser(user);

        return generateResponse(res, 200, ['User successfully registered.']);
    })
];

export const forgotPassword = [
    validate({
        emailAddress: validators.emailAddress
    }),
    wrap(async (req: Request, res: Response) => {
        const body = req.body as IForgotPasswordModel;

        const user = await repository.getUserByEmailAddress(body.emailAddress);

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
    })
];

export const resetPassword = [
    validate({
        code: validators.code,
        emailAddress: validators.emailAddress,
        newPassword: validators.newPassword
    }),
    wrap(async (req: Request, res: Response) => {
        const body = req.body as IResetPasswordModel;

        const user = await repository.getUserByEmailAddress(body.emailAddress);

        if (!user || user.passwordResetToken !== body.code) {
            return generateResponse(res, 400, ['Invalid token.']);
        }

        user.password = await password.hash(body.newPassword);
        user.passwordResetToken = undefined;
        user.twoFactorEnabled = undefined;
        user.twoFactorSecret = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your password has been reset.']);
    })
];
