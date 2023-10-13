import { AccountSettings, EventMessage, ROLE_ADMIN } from "@codeffekt/ce-core-data";
import { NextFunction, Response } from "express";
import { JwtUserRequest } from "../core/Auth";
import { CeService } from "../core/CeService";
import { CeEventClient } from "../servers/CeEventClient";
import { AuthService } from "../services/AuthService";
import { ContextService } from "../services/ContextService";

export interface ApiAnswer {
    res: string;
}

export const API_ANSWER_OK: ApiAnswer = {
    res: "OK"
};

export const API_ANSWER_EMPTY: ApiAnswer = {
    res: "EMPTY"
};

export function API_IS_EMPTY(body: any) {
    return body && body.res && body.res == "EMPTY";
}

export interface ApiCallParams {
    __token: string;
    __class: string;
    construct: any[];
    call: {
        function: string;
        params: any;
    };
    params: any;
}

export interface RouterFactoryElt {
    path: string;
    module: string;
}

export interface RouterFactory {
    [id: string]: RouterFactoryElt;
}

export interface DiagApiAccessParams {
    adminMethods: string[];
}

export interface CeApiModuleParams {
    components: any[];
}

export interface CeApiComponentParams {
    id?: string;
}

declare type ArgMapFunc = (ctx: any, arg?: any) => any;

interface ArgMap {
    mapper: ArgMapFunc;
    key: string;
    index: number;
}

export interface ApiComponent {
    __api_req: JwtUserRequest;
    __api_next: NextFunction;
    __api_res: Response;
    __api_funcs: string[];
    __params: CeApiComponentParams;
    __api_binds: ArgMap[];

    __haveApiFunc(f: string): boolean;
    __api_setContext(req: JwtUserRequest, res: Response, next: NextFunction): void;
}

export function CeApiModule(params: CeApiModuleParams) {
    return function classDecorator<T extends { new(...args: any[]): {} }>(constr: T) {
        
        constr.prototype.__services = params.components.map(c => ({
            id: c.prototype.__params.id,
            instance: undefined,
            constr: c
        }));

        constr.prototype.__findComponent = function (id: string) {

            const service = this.__services.find(s => s.id === id);

            if (!service) {
                throw new Error(`Component ${id} not found`);
            }

            if (!service.instance) { // lazy loading
                service.instance = new service.constr();
            }

            return service.instance;
        };

        constr.prototype.__callApi = async function (req: JwtUserRequest, res: Response, next: NextFunction) {
            try {

                const params: ApiCallParams = {
                    __token: undefined,
                    __class: undefined,
                    construct: [],
                    call: {
                        function: req.body["call[function]"] || undefined,
                        params: req.body["call[params]"] || undefined
                    },
                    params: undefined,
                    ...req.body
                };

                if (params.__class == undefined || params.call == undefined || params.call.function == undefined) {
                    throw new Error("Missing class and/or function arguments");
                }

                const classInst = this.__findComponent(params.__class);
                const callFunction = params.call.function;

                if (!classInst.__haveApiFunc(callFunction)) {
                    throw new Error(`Unknow API function ${callFunction} in module ${params.__class}`);
                }

                // set req and next available for API modules that needs specifics parameters such as upload files etc...
                // used also for method access rights                    
                classInst.__api_setContext(req, res, next);

                let funcRes = API_ANSWER_OK;

                if (params.call.params != undefined) {

                    if (!Array.isArray(params.call.params)) {
                        params.call.params = [params.call.params];
                    }

                    funcRes = (<any>classInst)[callFunction].apply(classInst, params.call.params);

                } else {
                    funcRes = (<any>classInst)[callFunction]();
                }

                const msg: EventMessage = {
                    id: CeService.get(ContextService).createUnique(),
                    type: "api",
                    name: params.__class + "::" + params.call.function,
                    params: params.call.params != undefined ? params.call.params : undefined
                };

                const finalRes = await Promise.resolve(funcRes);
                CeService.get(CeEventClient).fwd(msg, req.user.data.diagAccount);
                res.json(finalRes != undefined ? finalRes : {});
            } catch (err) {
                next(err);
            }
        };
        return constr;
    };
}

export function CeApiComponent(params?: CeApiComponentParams) {
    return function classDecorator<T extends { new(...args: any[]): {} }>(constr: T) {        
        constr.prototype.__params = {
            ...constr.prototype.__params,
            id: params && params.id ? params.id : constr.name
        };

        constr.prototype.__haveApiFunc = function (f: string) {
            return this.__api_funcs.includes(f);
        };

        constr.prototype.__api_setContext = function (req: JwtUserRequest, res: Response, next: NextFunction) {
            this.__api_req = req;
            this.__api_res = res;
            this.__api_next = next;
        };

        return constr;
    };
}

export function CeApiRole(role: string | string[], checkSuperAdmin = false) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function () {

            const instance = this as ApiComponent;

            const req = instance.__api_req;

            if (!req || !req.user) {
                throw new Error(`Unauthorized method access ${key}, for unknown user`);
            }

            if (checkSuperAdmin && !AuthService.isSuperAdmin(req.user.data.diagAccount)) {
                throw new Error(`Unauthorized method access ${key}, role ${role} needed`);
            } else if (!AuthService.isRole(req.user.data.diagAccount, role)) {
                throw new Error(`Unauthorized method access ${key}, role ${role} needed`);
            }

            const result = originalMethod.apply(this, arguments);
            return result;
        };
        return descriptor;
    };
}

export function CeApiAdmin(target: any, key: string, descriptor: PropertyDescriptor) {
    return CeApiRole(ROLE_ADMIN)(target, key, descriptor);
}

export function CeApiSuperAdmin(target: any, key: string, descriptor: PropertyDescriptor) {
    return CeApiRole(undefined, true)(target, key, descriptor);
}

export function CeApiAuthZ(resource: string, action: string) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function () {

            const instance = this as ApiComponent;

            if (!instance.__api_req || !instance.__api_req.user || !AuthService.isAuthZ(instance.__api_req.user.data.diagAccount, resource, action)) {
                throw new Error("Unauthorized method access " + key);
            }
            const result = originalMethod.apply(this, arguments);
            return result;
        };
        return descriptor;
    };
}

export function CeApiBinds(target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function () {

        const instance = this as ApiComponent;

        const originalArguments = Array.prototype.slice.call(arguments);

        if (target.__api_binds) {
            const bindsElements = target.__api_binds.filter((_: any) => _.key === key);
            let bindArguments: any[] = [];
            if (!originalArguments.length) {
                bindArguments = bindsElements.map(element => element.mapper(instance.__api_req));
            } else {
                // first handle arguments indexes inside original args
                const originalArgsMapped = originalArguments.map((arg: any, index: number) => {
                    const bArg: ArgMap = bindsElements.find((b: any) => b.index === index);
                    return bArg !== undefined ?
                        [bArg.mapper(instance.__api_req), arg] : [arg];
                });
                bindArguments = [
                    ...originalArgsMapped.flatMap((x: any) => x),
                    ...bindsElements.filter(
                        (element: any) => originalArguments[element.index] === undefined)
                        .map((element: any) => element.mapper(instance.__api_req))];

            }
            return originalMethod.apply(this, bindArguments);
        }
        return originalMethod.apply(this, originalArguments);
    };
    return descriptor;
}

export function CeApiCall(target: any, key: string, descriptor: PropertyDescriptor) {
    if (!target.__api_funcs) {
        target.__api_funcs = [];
    }
    target.__api_funcs.push(key);
    return descriptor;
}

function create_binding_elt(target: ApiComponent, key: string, mapper: ArgMapFunc, index: number) {
    const propElt = { mapper: mapper, key: key, index: index };
    if (!target.__api_binds) {
        target.__api_binds = [propElt];
    } else {
        target.__api_binds.push(propElt);
    }
}

export function CeApiAccountId(target: any, key: string, index: number) {
    create_binding_elt(
        target,
        key,
        (ctx: JwtUserRequest) => ctx.user.uid,
        index);
}

export function CeApiAccountSettings(target: any, key: string, index: number) {
    create_binding_elt(
        target,
        key,
        (req: JwtUserRequest, arg: AccountSettings) => Object.assign({}, arg,
            {
                id: req.user.uid
            }),
        index
    );
}


