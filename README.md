# Ampql-promisifies 

Simple wrapper around ampqlib. There is implemented most relevant use cases with rabbit-mq.

## Instalation
```bash
yarn add @qest/amqp-promisified
```

## Basic  scripts

- `yarn examples:publish-subscribe`
run basic example, it is necessary to create .env in config folder or set RABBIT_URL env environment
- `yarn examples:work-queues`
run basic example, it is necessary to create .env in config folder or set RABBIT_URL env environment

## Examples
This is basics for both examples. Tt defines transfered message, simple listener for consumer or worker and basic error handler. 
```typescript
interface IMyMessage {
    message: string;
    type: string;
    messageCounter: number;
}

const listener = {
    listen: (msg) => console.log(`type: ${msg.type}, message: ${msg.message}, count: ${msg.messageCounter}`), // tslint:disable-line
};
const errorHandler = {
    onError: e => console.log(`Error with message: ${e.message}`), // tslint:disable-line
};
```

### Publish/subscribe
Example is based on official documentation of lib - https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html

```typescript
import { RabbitConsumer, RabbitPublisher } from '@qest/amqp-promisified';

const main = async () => {
    let i = 0;
    const consumer = new RabbitConsumer<IMyMessage>(process.env.RABBIT_URL, 'qest');
    await consumer
        .use(listener)
        .onError(errorHandler)
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(errorHandler)        
        .subscribe();

    const publisher = new RabbitPublisher<IMyMessage>(process.env.RABBIT_URL, 'qest')
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(errorHandler);
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
```

### Work queues
Example is based on official documentation of lib - https://www.rabbitmq.com/tutorials/tutorial-two-javascript.html

```typescript
import { RabbitTaskEmitter, RabbitWorker } from '@qest/amqp-promisified';
import { Options } from 'amqplib';

interface IMyMessage {
    message: string;
}

const listener = {
    listen: (msg: IMyMessage) => console.log(`Work with message: ${msg.message}`), // tslint:disable-line         
};

const main = async () => {
    let i = 0;
    const queueName = 'qest-work-queue';

    const worker = new RabbitWorker<IMyMessage>(process.env.RABBIT_URL, queueName);
    await worker
        .use(listener)
        .onError(errorHandler)
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(errorHandler)        
        .subscribe();

    const taskEmiter = new RabbitTaskEmitter<IMyMessage>(process.env.RABBIT_URL, queueName)
        .enableReconnection({reconnectionTimeoutMs: 1000})
        .onConnectionError(errorHandler);
    const interval = setInterval(async () => {
        const message: IMyMessage = {message: `$test ${i++}`};
        await taskEmiter.publish(message);
        if (i === 5) {
            await taskEmiter.close();
            await worker.close();
            clearInterval(interval);
            process.exit(0);
        }
    }, 200);
};

main();
```