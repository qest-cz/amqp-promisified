import { IErrorHandler, ISubscribe, RabbitConsumer, RabbitPublisher } from '../src';

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
    };
};

const createErrorHandler = (listenerId): IErrorHandler => {
    return {
        onError: (e) => console.error(`Error on ${listenerId}: ${e.message}`), // tslint:disable-line
    };
};

const createConnectionErrorHandler = (listenerId): IErrorHandler => {
    return {
        onError: (e) => console.error(`ConnectionError on ${listenerId}: ${e.message}`), // tslint:disable-line
    };
};

const createConsumer = (id: string) => {
    const consumer = new RabbitConsumer<IMyMessage>(process.env.RABBIT_URL, 'qest')
        .use(makeListener(id))
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(createConnectionErrorHandler(id))
        .onError(createErrorHandler(id));

    consumer.subscribe()
        .catch(console.error); // tslint:disable-line

    return consumer;
};

const createPublisher = () => {
    return new RabbitPublisher<IMyMessage>(process.env.RABBIT_URL, 'qest')
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(createConnectionErrorHandler('publisher'));
};

const main = async () => {
    let i = 0;

    const publisher = createPublisher();
    const consumer1 = createConsumer('consumer1');
    const consumer2 = createConsumer('consumer2');

    const interval = setInterval(async () => {
        const message: IMyMessage = {message: `$test ${i++}`};
        try {
            await publisher.publish(message);
        } catch (e) {
            console.error(`publisher problem: ${e.message}`, message);  // tslint:disable-line
        }

        if (i === 50) {
            await publisher.close();
            await consumer1.close();
            await consumer2.close();
            clearInterval(interval);
            process.exit(0);
        }
    }, 1000);
};

main().catch(e => {
    console.error(e); // tslint:disable-line
    process.exit(1);
});
