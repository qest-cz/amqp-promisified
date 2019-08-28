import { Channel, Message } from 'amqplib';
import { ISubscribe } from '../interfaces';
import { RabbitSide } from '../rabbit-side';

export abstract class RabbitConsumeSide<M extends Object = any> extends RabbitSide {

    private readonly subscribes: ISubscribe<M>[] = [];

    use(subscribe: ISubscribe<M>) {
        this.subscribes.push(subscribe);
        return this;
    }

    protected prepareConsumeMessageFunction(channel: Channel, sendAck: boolean = true) {
        return (msg: Message) => {
            try {
                const parsed: M = JSON.parse(msg.content.toString());
                this.subscribes.forEach((s) => s.listen(parsed, msg));
                if (sendAck) {
                    channel.ack(msg);
                }
            } catch (e) {
                this.subscribes.forEach((s) => {
                    if (s.onError) {
                        s.onError(e, msg);
                    }
                });
                if (sendAck) {
                    channel.nack(msg);
                }
            }
        };
    }
}