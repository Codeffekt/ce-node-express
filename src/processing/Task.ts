import { FormInstanceExt, FormWrapper, IndexType, ProcessingMsg, ProcessingStatus } from '@codeffekt/ce-core-data';
import { Worker } from 'worker_threads';
import { Inject } from '../core/CeService';
import { RemoteApiService } from '../services/RemoteApiService';

export class Task {

    private worker: Worker;
    private processing: FormInstanceExt;

    @Inject(RemoteApiService)
    private readonly remoteApiService: RemoteApiService;

    constructor(private taskFile: string) {
    }

    async run(processing: FormInstanceExt) {

        await this.updateProcessingStatus("RUNNING");

        this.worker = new Worker('./src/processing/worker.js', {
            workerData: {
                context: {
                    processing,
                },
                path: this.taskFile,
            }
        });

        this.worker.on('message', (message: ProcessingMsg) => {
            console.log("Receive message", message);
            if (message.type === "DONE") {
                this.worker.terminate();
            }
        });

        this.worker.on('exit', (code) => {
            if (code !== 0) {
                this.worker.terminate();
            }
        });

    }

    async cancel() {
        if (!this.worker) {
            throw new Error(`Task is not running`);
        }

        await this.updateProcessingStatus("CANCELED" as any);
        this.worker.terminate();
    }

    status() {
        return this.processing;
    }

    haveProcessing() {
        return this.processing !== undefined;
    }

    isCurrentProcessing(pid: IndexType) {
        return this.haveProcessing() && this.processing.id === pid;
    }

    private async updateProcessingStatus(status: ProcessingStatus) {
        FormWrapper.setFormValue("status", status, this.processing);
        await this.remoteApiService.updateForm(this.processing);
    }
}