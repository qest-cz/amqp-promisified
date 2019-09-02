import { Channel, Message } from 'amqplib';
import { IErrorHandler, ISubscribe } from '../interfaces';
import { RabbitSide } from '../rabbit-side';

export abstract class RabbitConsumeSide<M extends Object = any> extends RabbitSide {
    private readonly subscribes: ISubscribe<M>[] = [];
    protected errorHandler: IErrorHandler;

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
            const parsed: M = JSON.parse(msg.content.toString());

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
}
