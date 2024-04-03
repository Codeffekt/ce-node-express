
import { ProcessingListener } from '../../src/processing/ProcessingListener';

export async function task(processingListener: ProcessingListener) {

    console.log(processingListener.getContext());

    setTimeout(() => {
        processingListener.onDone({ message: "End of processing" });
    }, 10000);
    

    processingListener.onUpdate({ message: "Still running" });
}


