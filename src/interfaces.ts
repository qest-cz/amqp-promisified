import { Message } from 'amqplib';

export interface ISubscribe<M extends Object> {
    listen: (message: M, originalMessage?: Message) => any;
}

export interface IErrorHandler {
    onError: (error: Error, originalMessage?: Message) => void;
}
