export const format = (value: string, obj: { [key: string]: string }) => {
    let result = value;

    for (const [key, replaceValue] of Object.entries(obj)) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), replaceValue);
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

export const isValidEmailAddress = (value: string) =>
    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);

export const isValidISODate = (value: string) =>
    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(
        value
    );
