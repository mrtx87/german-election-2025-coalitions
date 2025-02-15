import moment from "moment";

export const HURDLE = 5;

export function toDate(date) {
    return moment(date).format('DD.MM.YY');
}

export function deepCloneObject(obj) {
    if (typeof obj !== 'object' || !obj) {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj);
    }

    if (obj instanceof Array) {
        return obj.map(e => deepCloneObject(e));
    }

    const keys = Object.keys(obj);
    return keys.reduce((clone, key) => {
        const value = obj[key];
        clone[key] = deepCloneObject(value);
        return clone;
    }, {});
}

const partyToColorMapping = {
    spd: 'rgb(217, 77, 65)',
    union: 'rgb(97, 89, 82)',
    afd: 'rgb(117, 192, 235)',
    fdp: 'rgb(245, 210, 51)',
    linke: 'rgb(181, 107, 184)',
    bsw: 'rgb(191, 57, 100)',
    grüne: 'rgb(132, 196, 98)',
    sonstige: 'rgba(215,215,215,0.47)',
    'freie wähler': '#e4a320',
}

export function getColor(partyId) {
 return partyToColorMapping[partyId.toLowerCase()] || 'darkgrey';
}

export const sonstige = 'sonstige';