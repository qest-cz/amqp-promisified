import { Options, Replies } from 'amqplib';
import { ParseMessageFn } from '../../interfaces';
import { RabbitConsumeSide } from '../../rabbit-consume-side';

export class RabbitConsumer<M = any> extends RabbitConsumeSide<M> {
    constructor(
        rabbitMqUrl: string,
        private readonly exchange: string,
        private readonly type = 'fanout',
        private readonly options: Options.AssertExchange = { durable: false },
        parseMessageFn: ParseMessageFn<M> = null,
    ) {
        super(rabbitMqUrl, parseMessageFn);
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
        return channel.consume(q.queue, this.prepareConsumeMessageFunction(channel, !consumeOptions.noAck), consumeOptions);
    }
}
