import fetch from 'node-fetch';

export const get = async <T>(url: string): Promise<T> => {
    let result: T;

    try {
        const response = await fetch(url);
        result = await response.json();
    } catch (error) {
        console.error('HTTP Get Failed', error);
    }

    return result;
};
