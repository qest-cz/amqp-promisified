import { Channel, connect, Message, Options, Replies } from 'amqplib';
import { ISubscribe } from '../index';

export class RabbitConsumer<M extends Object = any> {
    private readonly rabbitMqUrl: string;
    private readonly exchange: string;
    private readonly type: string;
    private readonly options: Options.AssertExchange;
    private readonly subscribes: ISubscribe<M>[] = [];
    private channel: Channel;

    constructor(rabbitMqUrl: string, exchange: string, type = 'fanout', options: Options.AssertExchange = { durable: false }) {
        this.rabbitMqUrl = rabbitMqUrl;
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
        const channel = await this.getChannel();
        await channel.assertExchange(this.exchange, this.type, this.options);
        const q = await channel.assertQueue(queue, queueOptions);
        await channel.bindQueue(q.queue, this.exchange, pattern);
        return channel.consume(
            q.queue,
            (msg: Message) => {
                const parsed: M = JSON.parse(msg.content.toString());
                this.subscribes.forEach((s) => s.listen(parsed));
            },
            consumeOptions,
        );
    }

    async close() {
        await this.channel.close();
        this.channel = null;
    }

    private async getChannel(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }
        const con = await connect(this.rabbitMqUrl);
        this.channel = await con.createChannel();
        return this.channel;
    }
}
