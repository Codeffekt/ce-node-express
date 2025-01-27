import { Service } from "../core/CeService";
import { RabbitMqClient } from "../rabbitmq/RabbitMqClient";
import { EventListener } from "../events/EventListener";

export interface MessagesServerConfig {
    url: string;
    queues: string[];
}

@Service()
export class MessagesServer {

    private messageClient?: RabbitMqClient;
    private config: MessagesServerConfig;    

    constructor() {

    }

    async setConfig(config: MessagesServerConfig) {
        await this.close();
        this.config = config;
        this.messageClient = await RabbitMqClient.fromConfig({
            url: this.config.url,
            queues: this.config.queues,
        });
        console.log(`[MessagesServer] RabbitMq client ${config.url}`);
    }

    async close() {
        if (this.messageClient) {
            await this.messageClient.end();
            this.messageClient = undefined;
        }
    }

    sendMessage<T>(queue: string, msg: T) {
        this.messageClient?.sendToQueue<T>(queue, msg);
    }

    setMessageListener<T>(queue: string, listener: EventListener<T>) {
        this.messageClient?.setConsumeListener(queue, listener);
    }    
}