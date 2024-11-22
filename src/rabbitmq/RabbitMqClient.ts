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
        return client;
    }

    private async connect() {
        this.connection = await connect(this.config.url);
        this.channel = await this.connection.createChannel();             
        for(const queue of this.config.queues) {
            this.channel.assertQueue(queue, {
                durable: false
            });
            console.log(`[RabbitMqClient] create queue ${queue}`);
        }
    }

    async end() {
        await this.channel.close();
        await this.connection.close();
    }

    sendToQueue<T>(queue: string, message: T) {
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    }

    setConsumeListener(queue: string, eventListener: EventListener) {        
        this.channel.consume(queue, (msg) => {
            if(!msg) {
                return;
            }
            eventListener.onMessage(JSON.parse(msg.content.toString()));
        }, { noAck: true })
    }
}