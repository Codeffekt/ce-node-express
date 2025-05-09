type Constructable<T> = new (...args: any[]) => T;

interface ICeService {
    _params: CeServiceParams;
    _id: string;
}

export type CeServiceIdentifier<T = any> =
    Constructable<T> | string;


export interface CeServiceParams {
    id?: string;
    replace?: boolean;
}

export function Service(params?: CeServiceParams) {
    return function classDecorator<T extends { new(...args: any[]): {} }>(constr: T) {
        const id = params?.id ?? constr.name;
        CeService.add(id, constr);
        return constr;
    };
}

export function Inject(identifier) {    
    return function (target: Object, propertyKey: string) {
        const setter = () => {
            throw new Error(`Cannot change injected property ${propertyKey}`);
        }
        const getter = () => CeService.get(identifier);
        Object.defineProperty(target, propertyKey, {
            get: getter,
            set: setter
        });
    }
}

function retrieve_service_id<T = any>(identifier: CeServiceIdentifier<T>) {
    return typeof identifier === 'string' ? identifier : identifier.name;
}

export class CeService {

    private static SERVICES: { id: string, instance: ICeService, constr: Constructable<any> }[] = [];

    static get<T, U = T>(identifier: CeServiceIdentifier<T>): U {
        const serviceId = retrieve_service_id(identifier);
        const service = this.SERVICES.find(s => s.id === serviceId);        

        if (!service) {
            throw new Error(`Service ${identifier} not found`);
        }

        if (!service.instance) { // lazy loading            
            service.instance = new service.constr();
        }

        return service.instance as U;
    }

    static getServices() {
        return CeService.SERVICES;
    }

    static add<T = unknown>(id: string, constr: Constructable<any>) {
        const existingService = this.SERVICES.find(s => s.id === id);
        if (!existingService) {
            this.SERVICES.push({ id, instance: undefined, constr });
        }
    }

    static patch(services: [{ id: CeServiceIdentifier, provider: Constructable<any> }]) {
        for (const service of services) { 
            const serviceId = retrieve_service_id(service.id);                       
            const existingServiceIdx = this.SERVICES.findIndex(s => s.id === serviceId);
            const newServiceEntry = { id: serviceId, instance: undefined, constr: service.provider };            
            if(existingServiceIdx !== -1) {
                this.SERVICES[existingServiceIdx] = newServiceEntry;
            } else {
                this.SERVICES.push(newServiceEntry);
            }
        }
    }
}