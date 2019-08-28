import { Message, Options, Replies } from 'amqplib';
import { ISubscribe } from '../../interfaces';
import { RabbitSide } from '../../rabbit-side';

export class RabbitWorker<M extends Object = any> extends RabbitSide {
    private readonly queue: string;
    private readonly options: Options.AssertQueue;
    private readonly subscribes: ISubscribe<M>[] = [];

    constructor(rabbitMqUrl: string, queue: string, options: Options.AssertQueue = {durable: false}) {
        super(rabbitMqUrl);
        this.queue = queue;
        this.options = options;
    }

    use(subscribe: ISubscribe<M>): RabbitWorker {
        this.subscribes.push(subscribe);
        return this;
    }

    async subscribe(consumeOptions: Options.Consume = {}, prefetch ?: number): Promise<Replies.Consume> {
        const channel = await this.getChannel();

        const q = await channel.assertQueue(this.queue, this.options);
        if (prefetch) {
            channel.prefetch(prefetch);
        }
        return channel.consume(
            q.queue,
            (msg: Message) => {
                try {
                    const parsed: M = JSON.parse(msg.content.toString());
                    this.subscribes.forEach((s) => s.listen(parsed, msg));
                    channel.ack(msg);
                } catch (e) {
                    this.subscribes.forEach((s) => {
                        if (s.onError) {
                            s.onError(e, msg);
                        }
                    });
                    channel.nack(msg);
                }
            },
        );
    }
}
