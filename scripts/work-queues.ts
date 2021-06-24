import { Options } from 'amqplib';
import { IErrorHandler, ISubscribe, RabbitTaskEmitter, RabbitWorker } from '../src';

interface IMyMessage {
    message: string;
}

const createListener = (listenerId): ISubscribe<IMyMessage> => {
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
        onError: (e) => console.log(`Error on ${listenerId}: ${e.message}`), // tslint:disable-line
    };
};

const createConnectionErrorHandler = (listenerId): IErrorHandler => {
    return {
        onError: (e) => console.error(`ConnectionError on ${listenerId}: ${e.message}`), // tslint:disable-line
    };
};

const queueName = 'qest-queue';
const queueOptions: Options.AssertQueue = {
    autoDelete: true,
};

const consumeOptions: Options.Consume = {
    noAck: false,
};

const createWorker = (id: string) => {
    const worker = new RabbitWorker<IMyMessage>(process.env.RABBIT_URL, queueName, queueOptions)
        .use(createListener(id))
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onError(createErrorHandler(id))
        .onConnectionError(createConnectionErrorHandler(id));

    worker.subscribe(consumeOptions)
        .catch(console.error); // tslint:disable-line

    return worker;
};

const main = async () => {
    const worker = createWorker('worker1');
    const worker2 = createWorker('worker2');
    const taskEmitter = new RabbitTaskEmitter<IMyMessage>(process.env.RABBIT_URL, queueName, queueOptions)
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(createConnectionErrorHandler('taskEmitter'));

    let i = 0;
    const interval = setInterval(async () => {
        const message: IMyMessage = {message: `$test ${i++}`};
        try {
            await taskEmitter.publish(message);
        } catch (e) {
            console.error(`taskEmitter problem: ${e.message}`, message);  // tslint:disable-line
        }

        if (i === 5000) {
            await taskEmitter.close();
            await worker.close();
            await worker2.close();
            clearInterval(interval);
            process.exit(0);
        }
    }, 1000);
};

main().catch(e => {
    console.error(e); // tslint:disable-line
    process.exit(1);
});;
