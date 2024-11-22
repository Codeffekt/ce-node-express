import { FormEvent, FormRoot, IndexType } from "@codeffekt/ce-core-data";
import { Service } from "../core/CeService";
import { RabbitMqClient } from "../rabbitmq/RabbitMqClient";
import { EventListener } from "../events/EventListener";

export interface MessagesServerConfig {
    url: string;
}

@Service()
export class MessagesServer {

    private messageClient: RabbitMqClient;
    private config: MessagesServerConfig;
    private formsRootQueueId = "formsroot";
    private formsQueueId = "forms";

    constructor() {

    }

    async setConfig(config: MessagesServerConfig) {
        await this.close();
        this.config = config;
        this.messageClient = await RabbitMqClient.fromConfig({
            url: this.config.url,
            queues: [ this.formsQueueId, this.formsRootQueueId ]
        });
        console.log(`[MessagesServer] RabbitMq client ${config.url}`);
    }

    async close() {
        if (this.messageClient) {
            await this.messageClient.end();
            this.messageClient = undefined;
        }
    }

    sendFormsRootUpsert(root: FormRoot, author: IndexType) {
        this.messageClient.sendToQueue<FormEvent>(this.formsRootQueueId, {
            type: 'update',
            elts: [root.id],
            author,
            time: root.mtime,
        });
    }

    setFormsRootEventListener(listener: EventListener) {
        this.messageClient.setConsumeListener(this.formsRootQueueId, listener);
    }
}