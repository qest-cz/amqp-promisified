import { Channel, connect, Connection } from 'amqplib';
import { IErrorHandler, IReconnectionSettings } from '../interfaces';

export abstract class RabbitSide {
    private channel: Channel;
    protected connection: Connection;
    private channelState: 'ok' | 'waiting' | 'preconnect' | 'connecting' = 'preconnect';
    protected connectionErrorHandler: IErrorHandler;
    protected reconnectionSettings: IReconnectionSettings = {
        waitTimeoutMs: 100,
        reconnectionTimeoutMs: 0,
    };

    constructor(private readonly rabbitMqUrl: string) {}

    onConnectionError(errorHandler: IErrorHandler) {
        this.connectionErrorHandler = errorHandler;
        return this;
    }

    enableReconnection(reconnectionSettings: IReconnectionSettings) {
        this.reconnectionSettings = {
            ...this.reconnectionSettings,
            ...reconnectionSettings,
        };
        return this;
    }

    async close() {
        if (this.channel) {
            try {
                await this.channel.close();
            } catch (e) {
                this.handleConnectionError(e);
            }
        }
        this.channelState = 'preconnect';
        this.channel = null;
    }

    protected abstract async doReconnectionSteps(): Promise<void>;

    protected async getChannel(reason: string = ''): Promise<Channel> {
        if (this.channelState === 'ok') {
            return this.channel;
        }

        while (this.channelState === 'connecting' || this.channelState === 'waiting') {
            await new Promise((resolve) => setTimeout(resolve, this.reconnectionSettings.waitTimeoutMs));
        }

        if (this.channelState === 'preconnect') {
            this.channelState = 'connecting';
            try {
                await this.newConnection();
                this.channel = await this.connection.createChannel();
                this.channelState = 'ok';
            } catch (e) {
                this.handleConnectionError(e);
                this.channelState = 'preconnect';
            }
        }
        return this.channel;
    }

    protected async handleConnectionError(e: Error) {
        if (this.connectionErrorHandler) {
            this.connectionErrorHandler.onError(e);
        } else {
            throw e;
        }
    }

    private async newConnection() {
        this.connection = await connect(this.rabbitMqUrl);
        if (this.reconnectionSettings.reconnectionTimeoutMs) {
            this.connection.on('close', (event) => {
                this.channelState = 'waiting';
                return setTimeout(async () => {
                    await this.close();
                    await this.doReconnectionSteps();
                }, this.reconnectionSettings.reconnectionTimeoutMs);
            });
        }
        this.connection.on('error', (e) => {
            this.handleConnectionError(e);
        });
    }
}
