import { FormEvent } from '@codeffekt/ce-core-data';
import { FormsRootUpdate } from './formsroot/FormsRootUpdate';
import { Service } from '../core/CeService';
import { EventListener } from './EventListener';

@Service()
export class EventsRootFactory implements EventListener<FormEvent> {
    
    private elts: { [key: string]: (evt: FormEvent) => Promise<void> } = {
        "update": FormsRootUpdate.processEvent,
    };

    onMessage(queue: string, evt: FormEvent) {
        const process = this.elts[evt.type];

        if(!process) {
            throw new Error(`Process for event ${evt.type} not found`);
        }

        console.log(`[EventsRootFactory] : process event ${JSON.stringify(evt)}`);

        process(evt);
    }
}