import { RabbitConsumer, RabbitPublisher } from '../src';

interface IMyMessage {
    message: string;
    type: string;
    messageCounter: number;
}

const listener = {
    listen: (msg) => console.log(`type: ${msg.type}, message: ${msg.message}, count: ${msg.messageCounter}`), // tslint:disable-line
};

const main = async () => {
    let i = 0;
    const consumer = new RabbitConsumer<IMyMessage>(process.env.RABBIT_URL, 'qest');
    await consumer.use(listener).subscribe();

    const publisher = new RabbitPublisher<IMyMessage>(process.env.RABBIT_URL, 'qest');
    const interval = setInterval(async () => {
        const message: IMyMessage = { messageCounter: i++, type: 'test', message: `$test ${i}` };
        await publisher.publish(message);
        if (i === 5) {
            await publisher.close();
            await consumer.close();
            clearInterval(interval);
            process.exit(0);
        }
    }, 200);
};

main();
