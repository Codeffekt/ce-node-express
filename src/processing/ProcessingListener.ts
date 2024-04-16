import { FormInstanceExt, Processing, ProcessingMsg } from '@codeffekt/ce-core-data';
import { parentPort } from 'worker_threads';

export interface ProcessingListenerContext {
    processing: FormInstanceExt;
}

export class ProcessingListener {

    constructor(private context: ProcessingListenerContext) {

    }

    getContext(): ProcessingListenerContext {
        return this.context;
    }

    onUpdate(data: Partial<Processing>): void {
        parentPort.postMessage({
            type: "UPDATE",
            data
        } as ProcessingMsg);
    }
    
    onError(err: Error): void {
        parentPort.postMessage({
            type: "ERROR",
            data: {
                message: err.message,
                status: "ERROR"
            }
        });
    }
    
    onDone(data: Partial<Processing>): void {
        parentPort.postMessage({
            type: "DONE",
            data: {
                ...data,
                status: "DONE"
            }
        } as ProcessingMsg);
    }

}