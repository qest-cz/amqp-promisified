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

const main = async () => {
    let i = 0;
    const queueName = 'qest-queue';
    const queueOptions: Options.AssertQueue = {
        autoDelete: true,
    };

    const consumeOptions: Options.Consume = {
        noAck: true,
    };

    const worker = new RabbitWorker<IMyMessage>(process.env.RABBIT_URL, queueName, queueOptions);
    await worker
        .use(createListener('worker1'))
        .onError(createErrorHandler('worker1'))
        .subscribe(consumeOptions);

    const worker2 = new RabbitWorker<IMyMessage>(process.env.RABBIT_URL, queueName, queueOptions);
    await worker2
        .use(createListener('worker2'))
        .onError(createErrorHandler('worker2'))
        .subscribe(consumeOptions);

    const taskEmiter = new RabbitTaskEmitter<IMyMessage>(process.env.RABBIT_URL, queueName, queueOptions);
    const interval = setInterval(async () => {
        const message: IMyMessage = {message: `$test ${i++}`};
        await taskEmiter.publish(message);
        if (i === 5) {
            await taskEmiter.close();
            await worker.close();
            await worker2.close();
            clearInterval(interval);
            process.exit(0);
        }
    }, 200);
};

main();
