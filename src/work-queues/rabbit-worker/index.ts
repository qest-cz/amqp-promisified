import { Options, Replies } from 'amqplib';
import { ParseMessageFn } from '../../interfaces';
import { RabbitConsumeSide } from '../../rabbit-consume-side';

export class RabbitWorker<M = any> extends RabbitConsumeSide<M> {
    constructor(
        rabbitMqUrl: string,
        private readonly queue: string,
        private readonly options: Options.AssertQueue = { durable: false },
        parseMessageFn: ParseMessageFn<M> = null,
    ) {
        super(rabbitMqUrl, parseMessageFn);
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
