export interface ISubscribe<M extends Object> {
    listen: (message: M) => any;
}
