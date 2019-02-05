import { IUserModel } from '../models/user';
import jsonWebToken from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';
import * as repository from '../repositories/userRepository';
import config from './config';

const jwt = async (user: IUserModel) => {
    const expiresIn = 3600;

    const payload = {
        sub: user.id,
        email: user.emailAddress,
        given_name: user.firstName,
        family_name: user.lastName,
        picture: user.picture,
        role: user.roles && user.roles.join()
    };

    const accessToken = jsonWebToken.sign(payload, config.JWT_SECURITYKEY, {
        expiresIn
    });

    const refreshToken = await generateRefreshToken(user);

    return {
        accessToken,
        refreshToken,
        expiresIn
    };
};

const generateRefreshToken = async (user: IUserModel) => {
    user.refreshTokens = user.refreshTokens
        .sort((rt1, rt2) =>
            rt1.issued.getTime() > rt2.issued.getTime() ? -1 : 1
        )
        .filter((rt, index) => index < 10);

    const refreshToken = {
        token: uuidv4(),
        issued: new Date()
    };

    user.refreshTokens.push(refreshToken);
    await repository.updateUser(user);

    return refreshToken.token;
};

export default jwt;
