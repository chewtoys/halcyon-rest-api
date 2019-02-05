import { IProviderResponse } from '.';
import * as http from '../utils/http';
import config from '../utils/config';

const baseUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

export interface IGoogleResponse {
    sub: string;
    aud: string;
}

export const getUser = async (
    accessToken: string
): Promise<IProviderResponse> => {
    const url = `${baseUrl}?access_token=${accessToken}`;

    let result;
    try {
        result = await http.get<IGoogleResponse>(url);
    } catch (error) {
        console.error('Google Get User Failed', error);
    }

    const userId = result && result.sub;
    const aud = result && result.aud;

    if (!userId || aud !== config.GOOGLE_CLIENTID) {
        return undefined;
    }

    return {
        userId
    };
};
