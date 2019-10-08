import { Options } from 'amqplib';
import { RabbitSide } from '../../rabbit-side';

export class RabbitPublisher<T = any> extends RabbitSide {
    private readonly exchange: string;
    private readonly type: string;
    private readonly options: Options.AssertExchange;

    constructor(rabbitMqUrl: string, exchange: string, type = 'fanout', options: Options.AssertExchange = { durable: false }) {
        super(rabbitMqUrl);
        this.exchange = exchange;
        this.type = type;
        this.options = options;
    }

    async publish(object: T, routingKey: string = '', publishOptions?: Options.Publish) {
        const channel = await this.getChannel();
        await channel.assertExchange(this.exchange, this.type, this.options);
        channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(object)), publishOptions);
    }
}
