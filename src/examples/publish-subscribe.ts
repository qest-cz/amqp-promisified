import { RabbitConsumer, RabbitPublisher } from '../index';

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
    await new RabbitConsumer<IMyMessage>(process.env.RABBIT_URL, 'qest').use(listener).subscribe();

    const publisher = new RabbitPublisher<IMyMessage>(process.env.RABBIT_URL, 'qest');
    setInterval(() => publisher.publish({ messageCounter: i++, type: 'test', message: `$test ${i}` }), 1000);
};

main();
