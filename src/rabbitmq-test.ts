import { IMenuVersionQuery } from '../src/modules/menu/services/menu-tree-service';
import { Amqp, AmqpChannel, IAmqpChannelConsumer } from './rabbitmq-promisified';

const EXCHANGE = 'logs';

interface ICacheMessage {
    type: string;
    key: Object;
}

interface ITreeMesasge extends ICacheMessage {
    type: 'tree';
    key: { shopId: string; menuTypeItemId: string; itemId: string };
}

interface IVersionMessage extends ICacheMessage {
    type: 'version';
    key: IMenuVersionQuery;
}

type IMessageTypes = ITreeMesasge | IVersionMessage;

const consumer: IAmqpChannelConsumer<IMessageTypes> = {
    listen: async (msg) => {
        if (msg.content.type === 'tree') {
            const { shopId, itemId, menuTypeItemId } = msg.content.key;
            console.log(`type: ${msg.content.type}, key: ${shopId}:${menuTypeItemId}:${itemId}`);
        }
    },
};

export const createChannel = async () => {
    const con = await new Amqp().connect('amqp://rabbitmq.dev.qestapp.cz:5672');
    const channel = await con.createChannel();
    return channel;
};

const receiver = async (channel: AmqpChannel) => {
    await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true });
    channel.bindQueue(q.queue, EXCHANGE, '');

    channel.consume(q.queue, consumer, {});
};

const emmiter = async (channel: AmqpChannel) => {
    let i = 0;
    setInterval(async () => {
        i++;
        await channel.assertExchange(EXCHANGE, 'fanout', {
            durable: false,
        });
        channel.publishObject<IMessageTypes>(EXCHANGE, '', {
            type: 'tree',
            key: { menuTypeItemId: 'gdsag', shopId: 'CZ10MA', itemId: String(i) },
        });
    }, 2000);
};

const main = async () => {
    const channel = await createChannel();
    await receiver(channel);
    await emmiter(channel);
};

main();
