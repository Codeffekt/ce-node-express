import { Channel, connect, Connection } from "amqplib";
import { EventListener } from "../events/EventListener";

export interface RabbitMqClientConfig {
    url: string;
    queues: string[];
}

export class RabbitMqClient {

    private connection: Connection;
    private channel: Channel;

    private constructor(private config: RabbitMqClientConfig) {

    }

    static async fromConfig(config: RabbitMqClientConfig) {
        const client = new RabbitMqClient(config);
        await client.connect();
        await client.create_channel_queues();
        return client;
    }

    private async connect() {
        this.connection = await connect(this.config.url);        
    }

    private async create_channel_queues() {
        this.channel = await this.connection.createChannel();             
        for(const queue of this.config.queues) {
            await this.register_queue(queue);
        }
    }

    async end() {
        await this.channel.close();
        await this.connection.close();
    }

    sendToQueue<T>(queue: string, message: T) {
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    }

    setConsumeListener<T>(queue: string, eventListener: EventListener<T>) {        
        this.channel.consume(queue, (msg) => {
            if(!msg) {
                return;
            }
            eventListener.onMessage(queue, JSON.parse(msg.content.toString()));
        }, { noAck: true })
    }

    async register_queue(queue: string) {
        await this.channel.assertQueue(queue, {
            durable: false
        });
        console.log(`[RabbitMqClient] create queue ${queue}`);
    }
}