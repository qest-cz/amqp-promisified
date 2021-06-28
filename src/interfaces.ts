import { Message } from 'amqplib';

export interface ISubscribe<M> {
    listen: (message: M, originalMessage?: Message) => any;
}

export interface IErrorHandler {
    onError: (error: Error, originalMessage?: Message) => void;
}

export type ParseMessageFn<M> = (msgContent: Buffer) => M;

export interface IReconnectionSettings {
    waitTimeoutMs?: number;
    reconnectionTimeoutMs: number;
}
