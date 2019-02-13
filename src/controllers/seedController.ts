import { Request, Response } from 'express';
import { wrap } from 'async-middleware';
import * as repository from '../repositories/userRepository';
import * as password from '../utils/password';
import config from '../utils/config';
import { generateResponse } from '../utils/response';

export const seedData = wrap(async (req: Request, res: Response) => {
    const user = {
        emailAddress: config.SEED_EMAILADDRESS,
        password: await password.hash(config.SEED_PASSWORD),
        firstName: 'System',
        lastName: 'Administrator',
        dateOfBirth: '1970-01-01',
        roles: ['System Administrator']
    };

    const existing = await repository.getUserByEmailAddress(user.emailAddress);
    if (existing) {
        await repository.removeUser(existing);
    }

    await repository.createUser(user);

    return generateResponse(res, 200, ['Database seeded.']);
});
