import * as facebook from './facebook';
import * as google from './google';

export enum Provider {
    Facebook = 'Facebook',
    Google = 'Google'
}

export interface IProviderResponse {
    userId: string;
}

export interface IProvider {
    getUser: (accessToken: string) => Promise<IProviderResponse>;
}

export interface IProviders {
    [index: string]: IProvider;
}

const providers: IProviders = {
    Facebook: facebook,
    Google: google
};

export default providers;
