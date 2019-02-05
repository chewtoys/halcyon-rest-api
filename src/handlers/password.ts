import { IHandlerRequest, IHandlerResponse } from '.';
import * as repository from '../repositories/userRepository';
import * as password from '../utils/password';

export const authenticate = async (
    model: IHandlerRequest
): Promise<IHandlerResponse> => {
    const user = await repository.getUserByEmailAddress(model.emailAddress);
    if (!user) {
        return undefined;
    }

    const valid = await password.verify(model.password, user.password);
    if (!valid) {
        return undefined;
    }

    if (user.isLockedOut || user.twoFactorEnabled) {
        return {
            isLockedOut: user.isLockedOut,
            requiresTwoFactor: user.twoFactorEnabled
        };
    }

    return {
        user
    };
};
