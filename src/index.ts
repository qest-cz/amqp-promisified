// tslint:disable
import { Channel, Options, connect, Message, Replies } from 'amqplib';

export const createChannel = async (rabbitUrl: string) => {
    const con = await connect(rabbitUrl);
    return await con.createChannel();
};

export interface ISubscribe<M extends Object> {
    listen: (messaage: M) => any;
}

export class RabbitConsumer<M extends Object = any> {
    private channel: Channel;
    private exchange: string;
    private type: string;
    private options: Options.AssertExchange;
    private subscribes: ISubscribe<M>[] = [];

    constructor(channel: Channel, exchange: string, type = 'fanout', options: Options.AssertExchange = { durable: false }) {
        this.channel = channel;
        this.exchange = exchange;
        this.type = type;
        this.options = options;
    }

    use(subscribe: ISubscribe<M>): RabbitConsumer {
        this.subscribes.push(subscribe);
        return this;
    }

    async subscribe(
        queue: string = '',
        queueOptions: Options.AssertQueue = { exclusive: true },
        consumeOptions: Options.Consume = {},
        pattern: string = '',
    ): Promise<Replies.Consume> {
        await this.channel.assertExchange(this.exchange, this.type, this.options);
        const q = await this.channel.assertQueue(queue, queueOptions);
        await this.channel.bindQueue(q.queue, this.exchange, pattern);
        return this.channel.consume(
            q.queue,
            (msg: Message) => {
                const parsed: M = JSON.parse(msg.content.toString());
                this.subscribes.forEach((s) => s.listen(parsed));
            },
            consumeOptions,
        );
    }
}

export class RabbitPublisher<T extends Object = any> {
    private channel: Channel;
    private exchange: string;
    private type: string;
    private options: Options.AssertExchange;

    constructor(channel: Channel, exchange: string, type = 'fanout', options: Options.AssertExchange = { durable: false }) {
        this.channel = channel;
        this.exchange = exchange;
        this.type = type;
        this.options = options;
    }
    async publish(object: T, routingKey: string = '') {
        await this.channel.assertExchange(this.exchange, this.type, this.options);
        return this.channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(object)));
    }
}
