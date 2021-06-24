import { Options } from 'amqplib';
import { RabbitSide } from '../../rabbit-side';

export class RabbitTaskEmitter<T = any> extends RabbitSide {
    constructor(rabbitMqUrl: string, private readonly queue: string, private readonly options: Options.AssertQueue = { durable: false }) {
        super(rabbitMqUrl);
        this.queue = queue;
        this.options = options;
    }

    async publish(object: T, publishOptions?: Options.Publish) {
        const channel = await this.getChannel();
        await channel.assertQueue(this.queue, this.options);
        channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(object)), publishOptions);
    }

    protected async doReconnectionSteps(): Promise<void> {
        return;
    }
}
