import { createChannel, RabbitConsumer, RabbitPublisher } from '../index';

interface IMyMessage {
    message: string;
    type: string;
    messageCounter: number;
}

let i = 0;

const main = async () => {
    const channel = await createChannel(process.env.RABBIT_URL);

    await new RabbitConsumer<IMyMessage>(channel, 'qest')
        .use({
            listen: (msg) => console.log(`type: ${msg.type}, message: ${msg.message}, count: ${msg.messageCounter}`), // tslint:disable-line
        })
        .subscribe();

    const publisher = new RabbitPublisher<IMyMessage>(channel, 'qest');
    setInterval(() => publisher.publish({ messageCounter: i++, type: 'test', message: `$test ${i}` }), 1000);
};

main();
