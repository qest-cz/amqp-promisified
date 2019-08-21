import { Channel, connect, Options } from 'amqplib';

export class RabbitPublisher<T extends Object = any> {
    private readonly rabbitMqUrl: string;
    private readonly exchange: string;
    private readonly type: string;
    private readonly options: Options.AssertExchange;
    private channel: Channel;

    constructor(rabbitMqUrl: string, exchange: string, type = 'fanout', options: Options.AssertExchange = { durable: false }) {
        this.rabbitMqUrl = rabbitMqUrl;
        this.exchange = exchange;
        this.type = type;
        this.options = options;
    }
    async publish(object: T, routingKey: string = '') {
        const channel = await this.getChannel();
        await channel.assertExchange(this.exchange, this.type, this.options);
        channel.publish(this.exchange, routingKey, Buffer.from(JSON.stringify(object)));
    }

    async close() {
        await this.channel.close();
        this.channel = null;
    }

    private async getChannel(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }
        const con = await connect(this.rabbitMqUrl);
        this.channel = await con.createChannel();
        return this.channel;
    }
}
