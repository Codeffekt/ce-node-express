type Constructable<T> = new (...args: any[]) => T;

interface ICeService {
    _params: CeServiceParams;
    _id: string;
}

export type CeServiceIdentifier<T> =
    Constructable<T> | string;


export interface CeServiceParams {
    id?: string;
}

export function Service(params?: CeServiceParams) {
    return function classDecorator<T extends { new(...args: any[]): {} }>(constr: T) {        
        const id = params?.id ?? constr.name;        
        CeService.add(id, constr);
        return constr;
    };
}

export function Inject(identifier) {
    return function(target: Object, propertyKey: string) {
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

export class CeService {

    private static SERVICES: { id: string, instance: ICeService, constr: Constructable<any> }[] = [];    

    static get<T = unknown>(identifier: CeServiceIdentifier<T>): T {        
        let service;
        if (typeof identifier === 'string') {
            service = this.SERVICES.find(s => s.id === identifier);
        } else {
            service = this.SERVICES.find(s => s.id === identifier.name);
        }

        if (!service) {
            throw new Error(`Service ${identifier} not found`);
        }

        if (!service.instance) { // lazy loading            
            service.instance = new service.constr();            
        }

        return service.instance;
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
   
}