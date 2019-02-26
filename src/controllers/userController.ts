import * as repository from '../repositories/userRepository';
import { IUserModel as IUserDataModel } from '../models/user';
import wrap from '../middleware/asyncMiddleware';
import validate from '../middleware/validationMiddleware';
import * as password from '../utils/password';
import { tryParseInt } from '../utils/string';
import { generateResponse } from '../utils/response';

export interface IGetUsersModel {
    page: string;
    size: string;
    search?: string;
    sort?: string;
}

export interface IUserListModel {
    items: IUserModel[];
    search?: string;
    sort?: string;
    page: number;
    size: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface IUserParams {
    id: string;
}

export interface IUserModel {
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isLockedOut: boolean;
    hasPassword: boolean;
    emailConfirmed: boolean;
    twoFactorEnabled: boolean;
    picture: string;
    roles?: string[];
    logins: IExternalLoginModel[];
}

export interface IExternalLoginModel {
    provider: string;
    externalId: string;
}

export interface IBaseUserModel {
    emailAddress: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
}

export interface ICreateUserModel extends IBaseUserModel {
    password: string;
    roles?: string[];
}

export interface IUpdateUserModel extends IBaseUserModel {
    id: string;
    roles?: string[];
}

export const getUsers = wrap(async (req, res) => {
    const query = req.query as IGetUsersModel;
    const page = tryParseInt(query.page, 1);
    const size = tryParseInt(query.size, 10);

    const result = await repository.searchUsers(
        page,
        size,
        query.search,
        query.sort
    );

    return generateResponse<IUserListModel>(res, 200, undefined, {
        items: result.items.map(mapUser),
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
        search: query.search,
        sort: query.sort
    });
});

export const getUser = wrap(async (req, res) => {
    const params = req.params as IUserParams;

    const user = await repository.getUserById(params.id);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    const result = mapUser(user);
    return generateResponse<IUserModel>(res, 200, undefined, result);
});

export const createUser = [
    validate({
        emailAddress: { type: 'email', required: true, max: 254 },
        password: { required: true, min: 8, max: 50 },
        firstName: { required: true, max: 50 },
        lastName: { required: true, max: 50 },
        dateOfBirth: { type: 'date', required: true }
    }),
    wrap(async (req, res) => {
        const body = req.body as ICreateUserModel;

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
            roles: body.roles
        };

        await repository.createUser(user);

        return generateResponse(res, 200, ['User successfully created.']);
    })
];

export const updateUser = [
    validate({
        emailAddress: { type: 'email', required: true, max: 254 },
        firstName: { required: true, max: 50 },
        lastName: { required: true, max: 50 },
        dateOfBirth: { type: 'date', required: true }
    }),
    wrap(async (req, res) => {
        const params = req.params as IUserParams;
        const body = req.body as IUpdateUserModel;

        const user = await repository.getUserById(params.id);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (user.emailAddress !== body.emailAddress) {
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
        user.roles = body.roles;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['User successfully updated.']);
    })
];

export const lockUser = wrap(async (req, res) => {
    const params = req.params as IUserParams;

    const user = await repository.getUserById(params.id);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    if (user.id === res.locals.userId) {
        return generateResponse(res, 400, [
            'Cannot lock currently logged in user.'
        ]);
    }

    user.isLockedOut = true;
    await repository.updateUser(user);

    return generateResponse(res, 200, ['User successfully locked.']);
});

export const unlockUser = wrap(async (req, res) => {
    const params = req.params as IUserParams;

    const user = await repository.getUserById(params.id);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    user.isLockedOut = undefined;
    await repository.updateUser(user);

    return generateResponse(res, 200, ['User successfully unlocked.']);
});

export const deleteUser = wrap(async (req, res) => {
    const params = req.params as IUserParams;

    const user = await repository.getUserById(params.id);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    if (user.id === res.locals.userId) {
        return generateResponse(res, 400, [
            'Cannot delete currently logged in user.'
        ]);
    }

    await repository.removeUser(user);

    return generateResponse(res, 200, ['User successfully deleted.']);
});

export const mapUser = (user: IUserDataModel): IUserModel => ({
    id: user.id,
    emailAddress: user.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: new Date(user.dateOfBirth).toISOString(),
    isLockedOut: !!user.isLockedOut,
    hasPassword: user.hasPassword,
    emailConfirmed: !!user.emailConfirmed,
    twoFactorEnabled: !!user.twoFactorEnabled,
    picture: user.picture,
    roles: user.roles,
    logins: user.logins.map(login => ({
        provider: login.provider,
        externalId: login.externalId
    }))
});
