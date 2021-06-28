import { Options } from 'amqplib';
import { RabbitSide } from '../../rabbit-side';

export class RabbitPublisher<T = any> extends RabbitSide {
    constructor(
        rabbitMqUrl: string,
        private readonly exchange: string,
        private readonly type = 'fanout',
        private readonly options: Options.AssertExchange = { durable: false },
    ) {
        super(rabbitMqUrl);
    }

    async publish(object: T, routingKey: string = '', publishOptions?: Options.Publish) {
        const channel = await this.getChannel();
        await channel.assertExchange(this.exchange, this.type, this.options);
        channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(object)), publishOptions);
    }

    protected async doReconnectionSteps() {
        return;
    }
}
