import { IProviderResponse } from '.';
import { get } from '../utils/http';
import config from '../utils/config';

const baseUrl = 'https://graph.facebook.com/v3.1/debug_token';

export interface IFacebookResponse {
    data: IFacebookData;
}

export interface IFacebookData {
    user_id: string;
}

export const getUser = async (
    accessToken: string
): Promise<IProviderResponse> => {
    const url = `${baseUrl}?input_token=${accessToken}&access_token=${
        config.FACEBOOK_APPID
    }|${config.FACEBOOK_APPSECRET}`;

    const result = await get<IFacebookResponse>(url);
    if (!result || !result.data || !result.data.user_id) {
        return undefined;
    }

    return {
        userId: result.data.user_id
    };
};
