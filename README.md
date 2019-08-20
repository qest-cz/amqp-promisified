# Ampql-promisifies 

Simple wrapper around ampqlib. There is implemented most relevant use cases with rabbit-mq.


## Basic  scripts

- `yarn examples:publish-subscribe`
run basic example, it is necessary to create .env in config folder or set RABBIT_URL env environment

## Example
Example is based on official documentation of lib - https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html


```typescript
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



```
