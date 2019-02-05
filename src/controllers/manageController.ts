import { Request, Response } from 'express';
import uuidv4 from 'uuid/v4';
import * as repository from '../repositories/userRepository';
import providers from '../providers';
import * as password from '../utils/password';
import * as twoFactor from '../utils/twoFactor';
import * as email from '../utils/email';
import { validators } from '../utils/validators';
import { generateResponse, validationMiddleware } from '../utils/express';

export const getProfile = async (req: Request, res: Response) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    return generateResponse(res, 200, undefined, {
        emailAddress: user.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        hasPassword: user.hasPassword,
        emailConfirmed: user.emailConfirmed,
        twoFactorEnabled: user.twoFactorEnabled,
        picture: user.picture,
        logins: user.logins
    });
};

export const updateProfile = [
    validationMiddleware({
        emailAddress: validators.emailAddress,
        firstName: validators.firstName,
        lastName: validators.lastName,
        dateOfBirth: validators.dateOfBirth
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (req.body.emailAddress !== user.emailAddress) {
            const existing = await repository.getUserByEmailAddress(
                req.body.emailAddress
            );

            if (existing) {
                return generateResponse(res, 400, [
                    `User name "${req.body.emailAddress}" is already taken.`
                ]);
            }

            user.emailConfirmed = undefined;
            user.verifyEmailToken = undefined;
        }

        user.emailAddress = req.body.emailAddress;
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.dateOfBirth = req.body.dateOfBirth;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your profile has been updated.']);
    }
];

export const verifyEmail = async (req: Request, res: Response) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    if (user.emailConfirmed) {
        return generateResponse(res, 400, [
            'Your email address has already been verified.'
        ]);
    }

    user.verifyEmailToken = uuidv4();
    await repository.updateUser(user);

    await email.send({
        to: user.emailAddress,
        template: 'verifyEmail',
        context: {
            code: user.verifyEmailToken
        }
    });

    return generateResponse(res, 200, [
        'Instructions as to how to verify your email address have been sent to you via email.'
    ]);
};

export const confirmEmail = [
    validationMiddleware({
        code: validators.code
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (req.body.code !== user.verifyEmailToken) {
            return generateResponse(res, 400, ['Invalid token.']);
        }

        user.emailConfirmed = true;
        user.verifyEmailToken = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, [
            'Your email address has been verified.'
        ]);
    }
];

export const setPassword = [
    validationMiddleware({
        newPassword: validators.newPassword
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (user.password) {
            return generateResponse(res, 400, [
                'User already has a password set.'
            ]);
        }

        user.password = await password.hash(req.body.newPassword);
        user.passwordResetToken = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your password has been set.']);
    }
];

export const changePassword = [
    validationMiddleware({
        currentPassword: validators.currentPassword,
        newPassword: validators.newPassword
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        const valid = await password.verify(
            req.body.currentPassword,
            user.password
        );

        if (!valid) {
            return generateResponse(res, 400, ['Incorrect password.']);
        }

        user.password = await password.hash(req.body.newPassword);
        user.passwordResetToken = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your password has been changed.']);
    }
];

export const addLogin = [
    validationMiddleware({
        provider: validators.provider,
        accessToken: validators.accessToken
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

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

        const existing = await repository.getUserByLogin(
            req.body.provider,
            externalUser.userId
        );

        if (existing) {
            return generateResponse(res, 400, [
                'A user with this login already exists.'
            ]);
        }

        user.logins.push({
            provider: req.body.provider,
            externalId: externalUser.userId
        });

        await repository.updateUser(user);

        return generateResponse(res, 200, [
            `${req.body.provider} login added.`
        ]);
    }
];

export const removeLogin = [
    validationMiddleware({
        provider: validators.provider,
        externalId: validators.externalId
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        user.logins = user.logins.filter(
            login =>
                login.provider !== req.body.provider &&
                login.externalId !== req.body.externalId
        );
        await repository.updateUser(user);

        return generateResponse(res, 200, [
            `${req.body.provider} login removed.`
        ]);
    }
];

export const getTwoFactorConfig = async (req: Request, res: Response) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    const result = twoFactor.generate(`Halcyon (${user.emailAddress})`);

    user.twoFactorTempSecret = result.secret;
    await repository.updateUser(user);

    return generateResponse(res, 200, undefined, result);
};

export const enableTwoFactor = [
    validationMiddleware({
        verificationCode: validators.verificationCode
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        const verified = twoFactor.verify(
            req.body.verificationCode,
            user.twoFactorTempSecret
        );

        if (!verified) {
            return generateResponse(res, 400, [
                'Verification with authenticator app was unsuccessful.'
            ]);
        }

        user.twoFactorEnabled = true;
        user.twoFactorSecret = `${user.twoFactorTempSecret}`;
        user.twoFactorTempSecret = undefined;

        await repository.updateUser(user);

        return generateResponse(res, 200, [
            'Two factor authentication has been enabled.'
        ]);
    }
];

export const disableTwoFactor = async (req: Request, res: Response) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    user.twoFactorEnabled = undefined;
    user.twoFactorSecret = undefined;
    await repository.updateUser(user);

    return generateResponse(res, 200, [
        'Two factor authentication has been disabled.'
    ]);
};

export const deleteAccount = async (req: Request, res: Response) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    await repository.removeUser(user);

    return generateResponse(res, 200, ['Your account has been deleted.']);
};
