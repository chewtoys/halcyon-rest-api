import nodemailer from 'nodemailer';
import config from './config';
import * as string from './string';
import templates from '../resources/templates.json';

export interface IMessage {
    to: string;
    template: string;
    context: {};
}

export const send = async (message: IMessage) => {
    const template = templates.find(t => t.name === message.template);
    const subject = string.format(template.subject, message.context);
    const html = string.format(template.html, message.context);

    const transport = nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        auth: {
            user: config.EMAIL_USERNAME,
            pass: config.EMAIL_PASSWORD
        }
    });

    try {
        await transport.sendMail({
            from: config.EMAIL_NOREPLY,
            to: message.to,
            subject,
            html
        });
    } catch (error) {
        console.error('Email Send Failed', error);
    }
};
