import joi, { StringSchema } from 'joi';

export const validators: { [key: string]: StringSchema } = {
    emailAddress: joi
        .string()
        .required()
        .email()
        .max(254)
        .label('Email Address'),

    password: joi
        .string()
        .required()
        .min(8)
        .max(50)
        .label('Password'),

    firstName: joi
        .string()
        .required()
        .max(50)
        .label('First Name'),

    lastName: joi
        .string()
        .required()
        .max(50)
        .label('Last Name'),

    dateOfBirth: joi
        .string()
        .required()
        .isoDate()
        .label('Date of Birth'),

    currentPassword: joi
        .string()
        .required()
        .label('Current Password'),

    newPassword: joi
        .string()
        .required()
        .min(8)
        .max(50)
        .label('New Password'),

    provider: joi
        .string()
        .required()
        .max(50)
        .label('Provider'),

    externalId: joi
        .string()
        .required()
        .label('External Id'),

    accessToken: joi
        .string()
        .required()
        .label('Access Token'),

    code: joi
        .string()
        .required()
        .label('Code'),

    verificationCode: joi
        .string()
        .required()
        .label('Verification Code'),

    refreshToken: joi
        .string()
        .required()
        .label('Refresh Token'),

    grantType: joi
        .string()
        .required()
        .allow(['Password', 'RefreshToken', 'External', 'TwoFactor'])
        .label('Grant Type')
};

export const validateSchema = (data: any, fields: string[]): string[] => {
    const schema: { [key: string]: StringSchema } = {};

    for (const key of fields) {
        schema[key] = validators[key];
    }

    const valid = joi.validate(data || {}, joi.object().keys(schema), {
        abortEarly: false,
        allowUnknown: true
    });

    if (!valid.error) {
        return undefined;
    }

    return valid.error.details.map(error => error.message);
};
