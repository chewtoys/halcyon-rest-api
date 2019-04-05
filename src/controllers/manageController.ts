import uuidv4 from 'uuid/v4';
import * as repository from '../repositories/userRepository';
import {
    IUserModel,
    IBaseUserModel,
    IExternalLoginModel,
    mapUser
} from './userController';
import providers, { Provider } from '../providers';
import wrap from '../middleware/asyncMiddleware';
import validate from '../middleware/validationMiddleware';
import * as password from '../utils/password';
import * as twoFactor from '../utils/twoFactor';
import * as email from '../utils/email';
import { generateResponse } from '../utils/response';

export interface IUpdateProfileModel extends IBaseUserModel {}

export interface ISetPasswordModel {
    newPassword: string;
}

export interface IChangePasswordModel extends ISetPasswordModel {
    currentPassword: string;
}

export interface IConfirmEmailModel {
    code: string;
}

export interface IAddLoginModel {
    provider: Provider;
    accessToken: string;
}

export interface IRemoveLoginModel extends IExternalLoginModel {}

export interface ITwoFactorModel {
    secret: string;
    authenticatorUri: string;
}

export interface IEnableTwoFactorModel {
    verificationCode: string;
}

export const getProfile = wrap(async (_, res) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    const result = mapUser(user);
    return generateResponse<IUserModel>(res, 200, undefined, result);
});

export const updateProfile = [
    validate({
        emailAddress: { type: 'email', required: true, max: 254 },
        firstName: { required: true, max: 50 },
        lastName: { required: true, max: 50 },
        dateOfBirth: { type: 'date', required: true }
    }),
    wrap(async (req, res) => {
        const body = req.body as IUpdateProfileModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (body.emailAddress !== user.emailAddress) {
            const existing = await repository.getUserByEmailAddress(
                body.emailAddress
            );

            if (existing) {
                return generateResponse(res, 400, [
                    `User name "${body.emailAddress}" is already taken.`
                ]);
            }

            user.emailConfirmed = undefined;
            user.verifyEmailToken = undefined;
        }

        user.emailAddress = body.emailAddress;
        user.firstName = body.firstName;
        user.lastName = body.lastName;
        user.dateOfBirth = body.dateOfBirth;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your profile has been updated.']);
    })
];

export const verifyEmail = wrap(async (_, res) => {
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
});

export const confirmEmail = [
    validate({
        code: { required: true }
    }),
    wrap(async (req, res) => {
        const body = req.body as IConfirmEmailModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (body.code !== user.verifyEmailToken) {
            return generateResponse(res, 400, ['Invalid token.']);
        }

        user.emailConfirmed = true;
        user.verifyEmailToken = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, [
            'Your email address has been verified.'
        ]);
    })
];

export const setPassword = [
    validate({
        newPassword: { required: true, min: 8, max: 50 }
    }),
    wrap(async (req, res) => {
        const body = req.body as ISetPasswordModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (user.password) {
            return generateResponse(res, 400, [
                'User already has a password set.'
            ]);
        }

        user.password = await password.hash(body.newPassword);
        user.passwordResetToken = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your password has been set.']);
    })
];

export const changePassword = [
    validate({
        currentPassword: { required: true },
        newPassword: { required: true, min: 8, max: 50 }
    }),
    wrap(async (req, res) => {
        const body = req.body as IChangePasswordModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        const valid = await password.verify(
            body.currentPassword,
            user.password
        );

        if (!valid) {
            return generateResponse(res, 400, ['Incorrect password.']);
        }

        user.password = await password.hash(body.newPassword);
        user.passwordResetToken = undefined;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['Your password has been changed.']);
    })
];

export const addLogin = [
    validate({
        provider: {
            required: true,
            allow: Object.values(Provider).map(value => value)
        },
        accessToken: { required: true }
    }),
    wrap(async (req, res) => {
        const body = req.body as IAddLoginModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

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

        const existing = await repository.getUserByLogin(
            body.provider,
            externalUser.userId
        );

        if (existing) {
            return generateResponse(res, 400, [
                'A user with this login already exists.'
            ]);
        }

        user.logins.push({
            provider: body.provider,
            externalId: externalUser.userId
        });

        await repository.updateUser(user);

        return generateResponse(res, 200, [`${body.provider} login added.`]);
    })
];

export const removeLogin = [
    validate({
        provider: {
            required: true,
            allow: Object.values(Provider).map(value => value)
        },
        externalId: { required: true, max: 50 }
    }),
    wrap(async (req, res) => {
        const body = req.body as IRemoveLoginModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        user.logins = user.logins.filter(
            login =>
                login.provider !== body.provider &&
                login.externalId !== body.externalId
        );

        await repository.updateUser(user);

        return generateResponse(res, 200, [`${body.provider} login removed.`]);
    })
];

export const getTwoFactorConfig = wrap(async (_, res) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    const result = twoFactor.generate(`Halcyon (${user.emailAddress})`);

    user.twoFactorTempSecret = result.secret;
    await repository.updateUser(user);

    return generateResponse<ITwoFactorModel>(res, 200, undefined, result);
});

export const enableTwoFactor = [
    validate({
        verificationCode: { required: true }
    }),
    wrap(async (req, res) => {
        const body = req.body as IEnableTwoFactorModel;

        const user = await repository.getUserById(res.locals.userId);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        const verified = twoFactor.verify(
            body.verificationCode,
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
    })
];

export const disableTwoFactor = wrap(async (_, res) => {
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
});

export const deleteAccount = wrap(async (_, res) => {
    const user = await repository.getUserById(res.locals.userId);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    await repository.removeUser(user);

    return generateResponse(res, 200, ['Your account has been deleted.']);
});
