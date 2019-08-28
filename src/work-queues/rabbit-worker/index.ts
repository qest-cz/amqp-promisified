import { Options, Replies } from 'amqplib';
import { RabbitConsumeSide } from '../../rabbit-consume-side';

export class RabbitWorker<M extends Object = any> extends RabbitConsumeSide<M> {
    private readonly queue: string;
    private readonly options: Options.AssertQueue;

    constructor(rabbitMqUrl: string, queue: string, options: Options.AssertQueue = { durable: false }) {
        super(rabbitMqUrl);
        this.queue = queue;
        this.options = options;
    }

    async subscribe(consumeOptions: Options.Consume = {}, prefetch?: number): Promise<Replies.Consume> {
        const channel = await this.getChannel();

        const q = await channel.assertQueue(this.queue, this.options);
        if (prefetch) {
            channel.prefetch(prefetch);
        }
        return channel.consume(q.queue, this.prepareConsumeMessageFunction(channel, !consumeOptions.noAck), consumeOptions);
    }
}
