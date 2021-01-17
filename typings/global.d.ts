export {};

declare global {
    interface Window {
        chrome: string;
    }

    type Nullable<T> = T | null;

    type PlainMap = {
        [key: string]: any;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type DeepMap = {
        [key: string]: DeepMap | any;
    };
}
