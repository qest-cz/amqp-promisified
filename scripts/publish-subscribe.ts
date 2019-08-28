import { ISubscribe, RabbitConsumer, RabbitPublisher } from '../src';

interface IMyMessage {
    message: string;
}

const makeListener = (listenerId): ISubscribe<IMyMessage> => {
    return {
        listen: (msg: IMyMessage) => {
            if (Math.round(Math.random() * 10) % 2 === 0) {
                console.log(`${listenerId} work with message: ${msg.message}`); // tslint:disable-line
            } else {
                throw new Error(`Someting bad with ${msg.message}`);
            }
        },
        onError: e => console.log(`Error on ${listenerId}: ${e.message}`), // tslint:disable-line
    };
};

const main = async () => {
    let i = 0;
    const consumer = new RabbitConsumer<IMyMessage>(process.env.RABBIT_URL, 'qest');
    await consumer.use(makeListener('consumer1')).subscribe('', {

    });

    const consumer2 = new RabbitConsumer<IMyMessage>(process.env.RABBIT_URL, 'qest');
    await consumer2.use(makeListener('consumer2')).subscribe();

    const publisher = new RabbitPublisher<IMyMessage>(process.env.RABBIT_URL, 'qest');
    const interval = setInterval(async () => {
        const message: IMyMessage = { message: `$test ${i++}` };
        await publisher.publish(message);
        if (i === 5) {
            await publisher.close();
            await consumer.close();
            await consumer2.close();
            clearInterval(interval);
            process.exit(0);
        }
    }, 200);
};

main();
