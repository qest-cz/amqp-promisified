# Ampql-promisifies 

Simple wrapper around ampqlib. There is implemented most relevant use cases with rabbit-mq.

## Instalation
```bash
yarn add @qest/amqp-promisified
```

## Basic  scripts

- `yarn examples:publish-subscribe`
run basic example, it is necessary to create .env in config folder or set RABBIT_URL env environment

## Example
Example is based on official documentation of lib - https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html


```typescript
import { RabbitConsumer, RabbitPublisher } from '@qest/amqp-promisified';

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




```
