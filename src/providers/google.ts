import { IProviderResponse } from '.';
import { get } from '../utils/http';
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
    const result = await get<IGoogleResponse>(url);

    const userId = result && result.sub;
    const aud = result && result.aud;

    if (!userId || aud !== config.GOOGLE_CLIENTID) {
        return undefined;
    }

    return {
        userId
    };
};
