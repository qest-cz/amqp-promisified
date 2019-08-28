import { Channel, connect } from 'amqplib';

export abstract class RabbitSide {
    private readonly rabbitMqUrl: string;
    private channel: Channel;

    constructor(rabbitMqUrl: string) {
        this.rabbitMqUrl = rabbitMqUrl;
    }

    async close() {
        await this.channel.close();
        this.channel = null;
    }

    protected async getChannel(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }
        const con = await connect(this.rabbitMqUrl);
        this.channel = await con.createChannel();
        return this.channel;
    }
}