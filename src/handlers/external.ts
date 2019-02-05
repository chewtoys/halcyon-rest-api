import { IHandlerRequest, IHandlerResponse } from '.';
import * as repository from '../repositories/userRepository';
import providers from '../providers';

export const authenticate = async (
    model: IHandlerRequest
): Promise<IHandlerResponse> => {
    const provider = providers[model.provider];
    if (!provider) {
        return undefined;
    }

    const externalUser = await provider.getUser(model.accessToken);
    if (!externalUser) {
        return undefined;
    }

    const user = await repository.getUserByLogin(
        model.provider,
        externalUser.userId
    );

    if (!user) {
        return {
            requiresExternal: true
        };
    }

    if (user.isLockedOut) {
        return {
            isLockedOut: true
        };
    }

    return {
        user
    };
};
