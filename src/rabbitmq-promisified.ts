// tslint:disable
import * as amqp from 'amqplib/callback_api';
import { MessageFields, MessageProperties, Options, Replies } from 'amqplib/callback_api';

export class Amqp {
    async connect(url: string): Promise<AmqpConnection> {
        return new Promise((resolve, reject) => {
            amqp.connect(url, (err, connection) => {
                return err ? reject(err) : resolve(new AmqpConnection(connection));
            });
        });
    }
}

export class AmqpConnection {
    connection: amqp.Connection;
    constructor(connection: amqp.Connection) {
        this.connection = connection;
    }

    getConnection() {
        return this.connection;
    }

    createChannel(): Promise<AmqpChannel> {
        return new Promise((resolve, reject) => {
            this.connection.createChannel((err, channel) => {
                err ? reject(err) : resolve(new AmqpChannel(channel));
            });
        });
    }
}

export interface IAmqpMessage<C> {
    content: C;
    fields: MessageFields;
    properties: MessageProperties;
}

export interface IAmqpChannelConsumer<C> {
    listen: (msg: IAmqpMessage<C>) => Promise<any>;
}

export class AmqpChannel {
    channel: amqp.Channel;

    constructor(channel: amqp.Channel) {
        this.channel = channel;
    }

    getChannel() {
        return this.channel;
    }

    assertQueue(queue: string, options?: Options.AssertQueue): Promise<Replies.AssertQueue> {
        return new Promise((resolve, reject) => {
            this.channel.assertQueue(queue, options, (error2, q) => {
                error2 ? reject(error2) : resolve(q);
            });
        });
    }

    bindQueue(queue: string, source: string, pattern: string, args?: any): Replies.Empty {
        return new Promise((resolve, reject) => {
            this.channel.bindQueue(queue, source, pattern, args, (err, res) => {
                err ? reject(err) : resolve(res);
            });
        });
    }

    assertExchange(exchange: string, type: string, options?: Options.AssertExchange): Promise<Replies.AssertExchange> {
        return new Promise((resolve, reject) => {
            this.channel.assertExchange(exchange, type, options, (err, res) => {
                err ? reject(err) : resolve(res);
            });
        });
    }

    publish(exchange: string, routingKey: string, content: Buffer, options?: Options.Publish): boolean {
        return this.channel.publish(exchange, routingKey, content, options);
    }

    publishObject<T extends Object>(exchange: string, routingKey: string, content: T, options?: Options.Publish): boolean {
        const message = Buffer.from(JSON.stringify(content));
        return this.channel.publish(exchange, routingKey, message, options);
    }

    consume<T extends Object = any>(queue: string, consumer: IAmqpChannelConsumer<T>, options?: Options.Consume): void {
        this.channel.consume(
            queue,
            (msg) => {
                if (msg.content) {
                    consumer.listen({ ...msg, content: JSON.parse(msg.content.toString()) });
                }
            },
            options,
        );
    }
}
