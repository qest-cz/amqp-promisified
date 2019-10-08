import { Channel, Message } from 'amqplib';
import { IErrorHandler, ISubscribe, ParseMessageFn } from '../interfaces';
import { RabbitSide } from '../rabbit-side';

export abstract class RabbitConsumeSide<M = any> extends RabbitSide {
    private readonly subscribes: ISubscribe<M>[] = [];
    protected errorHandler: IErrorHandler;
    protected parseMessageFn: ParseMessageFn<M>;

    constructor(rabbitMqUrl: string, parseMessageFn: ParseMessageFn<M> = null) {
        super(rabbitMqUrl);
        if (parseMessageFn) {
            this.parseMessageFn = parseMessageFn;
        } else {
            this.parseMessageFn = this.parseMessageJson;
        }
    }

    use(subscribe: ISubscribe<M>) {
        this.subscribes.push(subscribe);
        return this;
    }

    onError(errorHandler: IErrorHandler) {
        this.errorHandler = errorHandler;
        return this;
    }

    protected prepareConsumeMessageFunction(channel: Channel, sendAck: boolean = true) {
        return (msg: Message) => {
            const parsed = this.parseMessageFn(msg.content);

            const promises = this.subscribes.map(async (s) => s.listen(parsed, msg));
            Promise.all(promises)
                .then(() => {
                    return sendAck ? channel.ack(msg) : null;
                })
                .catch((e) => {
                    if (this.errorHandler) {
                        this.errorHandler.onError(e, msg);
                    }
                    return sendAck ? channel.nack(msg) : null;
                });
        };
    }

    private parseMessageJson(msgContent: Buffer): M {
        const messageString = msgContent.toString();
        return JSON.parse(messageString);
    }
}
