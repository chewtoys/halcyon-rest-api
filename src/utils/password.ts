import bcrypt from 'bcryptjs';

export const hash = (password: string) => bcrypt.hash(password, 10);

export const verify = (password: string, hashedString: string) => {
    if (!password || !hashedString) {
        return false;
    }

    return bcrypt.compare(password, hashedString);
};
