export class Env {
    public static GetEnv(key: string, defaultValue: string | number) {
        const value = process.env[key];
        if (value === undefined) return defaultValue;
        if (typeof defaultValue === 'number') {
            if (value.indexOf('.') >= 0) return parseFloat(value)
            else return parseInt(value)
        }
        return value;
    }
}