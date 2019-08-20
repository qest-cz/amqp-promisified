import { Amqp, AmqpChannel, IAmqpChannelConsumer } from '../rabbitmq-promisified';

const EXCHANGE = 'logs';

interface IMessage {
    user: string;
    sex: 'male' | 'woman';
}

const consumer: IAmqpChannelConsumer<IMessage> = {
    listen: async (msg) => {
        console.log(`sex: ${msg.content.sex}, user: ${msg.content.user}`); // tslint:disable-line
    },
};

export const createChannel = async () => {
    const con = await new Amqp().connect(process.env.RABBIT_URL);
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
        channel.publishObject<IMessage>(EXCHANGE, '', {
            user: `Karel${i}`,
            sex: 'male',
        });
    }, 2000);
};

const main = async () => {
    const channel = await createChannel();
    await receiver(channel);
    await emmiter(channel);
};

main();
