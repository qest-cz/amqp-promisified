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
            const parsed: M = JSON.parse(msg.content.toString());
            let hasErrors = false;

            const promises = this.subscribes.map((s) => {
                const promisifed = async () => s.listen(parsed, msg);
                promisifed().catch((e) => {
                    if (s.onError) {
                        s.onError(e, msg);
                    }
                    hasErrors = true;
                });
            });
            Promise.all(promises).then(() => {
                if (sendAck) {
                    if (hasErrors) {
                        channel.nack(msg);
                    } else {
                        channel.ack(msg);
                    }
                }
            });
        };
    }
}
