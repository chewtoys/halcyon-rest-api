import { Request, Response } from 'express';
import * as repository from '../repositories/userRepository';
import validate from '../middleware/validationMiddleware';
import * as password from '../utils/password';
import { tryParseInt } from '../utils/string';
import { validators } from '../utils/validators';
import { generateResponse } from '../utils/response';

export const getUsers = async (req: Request, res: Response) => {
    const page = tryParseInt(req.query.page, 1);
    const size = tryParseInt(req.query.size, 10);

    const result = await repository.searchUsers(
        page,
        size,
        req.query.search,
        req.query.sort
    );

    return generateResponse(res, 200, undefined, {
        items: result.items.map(user => ({
            id: user.id,
            emailAddress: user.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            isLockedOut: user.isLockedOut,
            hasPassword: user.hasPassword,
            emailConfirmed: user.emailConfirmed,
            twoFactorEnabled: user.twoFactorEnabled,
            picture: user.picture
        })),
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
        search: req.query.search,
        sort: req.query.sort
    });
};

export const createUser = [
    validate({
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
            roles: req.body.roles
        };

        await repository.createUser(user);

        return generateResponse(res, 200, ['User successfully created.']);
    }
];

export const getUser = async (req: Request, res: Response) => {
    const user = await repository.getUserById(req.params.id);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    return generateResponse(res, 200, undefined, {
        id: user.id,
        emailAddress: user.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        isLockedOut: user.isLockedOut,
        hasPassword: user.hasPassword,
        emailConfirmed: user.emailConfirmed,
        twoFactorEnabled: user.twoFactorEnabled,
        roles: user.roles,
        picture: user.picture
    });
};

export const updateUser = [
    validate({
        emailAddress: validators.emailAddress,
        firstName: validators.firstName,
        lastName: validators.lastName,
        dateOfBirth: validators.dateOfBirth
    }),
    async (req: Request, res: Response) => {
        const user = await repository.getUserById(req.params.id);
        if (!user) {
            return generateResponse(res, 404, ['User not found.']);
        }

        if (user.emailAddress !== req.body.emailAddress) {
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
        user.roles = req.body.roles;
        await repository.updateUser(user);

        return generateResponse(res, 200, ['User successfully updated.']);
    }
];

export const lockUser = async (req: Request, res: Response) => {
    const user = await repository.getUserById(req.params.id);
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
};

export const unlockUser = async (req: Request, res: Response) => {
    const user = await repository.getUserById(req.params.id);
    if (!user) {
        return generateResponse(res, 404, ['User not found.']);
    }

    user.isLockedOut = undefined;
    await repository.updateUser(user);

    return generateResponse(res, 200, ['User successfully unlocked.']);
};

export const deleteUser = async (req: Request, res: Response) => {
    const user = await repository.getUserById(req.params.id);
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
};
