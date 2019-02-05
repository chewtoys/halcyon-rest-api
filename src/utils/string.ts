export const format = (value: string, obj: any) => {
    let result = value;

    for (const key of Object.keys(obj)) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), obj[key]);
    }

    return result;
};

export const tryParseInt = (str: string, defaultValue: number) => {
    if (!str) {
        return defaultValue;
    }

    const value = parseInt(str, 10);
    if (value < 1) {
        return defaultValue;
    }

    return value;
};
