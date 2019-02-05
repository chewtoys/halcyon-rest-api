import { IHandlerRequest, IHandlerResponse } from '.';
import * as repository from '../repositories/userRepository';

export const authenticate = async (
    model: IHandlerRequest
): Promise<IHandlerResponse> => {
    const user = await repository.getUserByRefreshToken(model.refreshToken);
    if (!user) {
        return undefined;
    }

    if (user.isLockedOut) {
        return {
            isLockedOut: true
        };
    }

    user.refreshTokens = user.refreshTokens.filter(
        rt => rt.token !== model.refreshToken
    );

    return {
        user
    };
};
