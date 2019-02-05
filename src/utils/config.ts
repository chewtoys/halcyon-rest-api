import 'dotenv/config';

const config = {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECURITYKEY: process.env.JWT_SECURITYKEY,
    SEED_EMAILADDRESS: process.env.SEED_EMAILADDRESS,
    SEED_PASSWORD: process.env.SEED_PASSWORD,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10),
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_NOREPLY: process.env.EMAIL_NOREPLY,
    FACEBOOK_APPID: process.env.FACEBOOK_APPID,
    FACEBOOK_APPSECRET: process.env.FACEBOOK_APPSECRET,
    GOOGLE_CLIENTID: process.env.GOOGLE_CLIENTID
};

export default config;
