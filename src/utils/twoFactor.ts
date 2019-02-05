import speakeasy from 'speakeasy';

export const generate = (label: string) => {
    const secret = speakeasy.generateSecret({ length: 10 });
    const authenticatorUri = speakeasy.otpauthURL({
        secret: secret.base32,
        label
    });

    return {
        secret: secret.base32,
        authenticatorUri
    };
};

export const verify = (token: string, secret: string) => {
    if (!token || !secret) {
        return false;
    }

    return speakeasy.totp.verify({
        encoding: 'base32',
        token,
        secret
    });
};
