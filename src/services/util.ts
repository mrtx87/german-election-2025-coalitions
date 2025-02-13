
export const HURDLE = 5;

export function deepCloneObject(obj) {
    if(typeof obj !== 'object' || !obj) {
        return obj;
    }

    if(obj instanceof Date) {
        return new Date(obj);
    }

    if(obj instanceof Array) {
        return obj.map(e => deepCloneObject(e));
    }

    const keys = Object.keys(obj);
    return keys.reduce((clone, key) => {
        const value = obj[key];
        clone[key] = deepCloneObject(value);
        return clone;
    }, {});
}

export const sonstige = 'sonstige';