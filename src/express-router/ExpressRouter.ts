import {
    Application,
    Router, RequestHandler as ExpressRequestHandler, 
    Request, Response, NextFunction, RequestHandler
} from "express";
import { Params, unless } from "express-unless";
import { ROLE_ADMIN } from "@codeffekt/ce-core-data";
import { JwtUserRequest } from "../core/Auth";
import { AuthService } from "../services/AuthService";

type ExpressRouterElementType = 'get' | 'post' | 'use' | 'app-use';

interface ExpressRouterElement {
    type: ExpressRouterElementType;
    params: ExpressRouterParams | ExpressRouterAppUseParams;
    methodFunc: Function;
}

interface ExpressRouterParams {
    path: string | RegExp | Array<string | RegExp>;
    useTryCatch?: boolean;
}

interface ExpressRouterController {
    _elements: ExpressRouterElement[];
    _params: ExpressRouterParams;
}

interface ExpressRouterAppUseParams {
    path?: string;
    unless?: Params;
    useTryCatch?: boolean;
}

interface RestrictableRequestHandler extends RequestHandler {
    unless?: Function;
}

function getExpressRouterMethodDecorator(params: ExpressRouterParams | ExpressRouterAppUseParams, type: ExpressRouterElementType) {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ): void => {

        if (!target._elements) {
            target._elements = [];
        }

        target._elements.push({
            type: type,
            params,
            methodFunc: descriptor.value
        } as ExpressRouterElement);
    };
}

function buildMiddleWareUnless(func: ExpressRequestHandler): RestrictableRequestHandler {
    const middle: RestrictableRequestHandler = func;
    middle.unless = unless;
    return middle;
}

export function Controller(params: ExpressRouterParams) {
    return function classDecorator<T extends { new(...args: any[]): {} }>(constr: T) {
        constr.prototype._elements = [...constr.prototype._elements];
        constr.prototype._params = params;        
        return constr;
    };
}

export function Get(params: ExpressRouterParams) {
    return getExpressRouterMethodDecorator(params, 'get');
}

export function Post(params: ExpressRouterParams) {
    return getExpressRouterMethodDecorator(params, 'post');
}

export function Use(params?: ExpressRouterAppUseParams) {
    return getExpressRouterMethodDecorator(params, 'use');
}

export function AppUse(params?: ExpressRouterAppUseParams) {
    return getExpressRouterMethodDecorator(params, 'app-use');
}

export function haveRole(role: string | string[], checkSuperAdmin = false) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = (req: JwtUserRequest, res: Response, next: NextFunction) => {            

            if (!req || !req.user) {
                throw new Error(`Unauthorized method access ${key}, for unknown user`);
            }

            if (checkSuperAdmin && !AuthService.isSuperAdmin(req.user.data.diagAccount)) {
                throw new Error(`Unauthorized method access ${key}, role ${role} needed`);
            } else if (!AuthService.isRole(req.user.data.diagAccount, role)) {
                throw new Error(`Unauthorized method access ${key}, role ${role} needed`);
            }            
            return originalMethod.apply(this, req, res, next);
        };
        return descriptor;
    };
}

export function isAdmin(target: any, key: string, descriptor: PropertyDescriptor) {
    return haveRole(ROLE_ADMIN)(target, key, descriptor);
}

function wrapTryCatch(func: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            return func(req, res, next);
        } catch (err) {
            next(err);
        }
    };
}

function createMethodFunc(element: ExpressRouterElement, controller: ExpressRouterController) {
    const bindFunc = element.methodFunc.bind(controller);
    return (controller._params?.useTryCatch || element.params?.useTryCatch) ?
        wrapTryCatch(bindFunc) : bindFunc;
}

export class ExpressRouter {
    static use(object: any, app: Application) {

        const controller = object as ExpressRouterController;

        if (!controller._elements || !controller._params) {
            throw new Error("Cannot create express router, missing @Controller decorator");
        }

        if (!controller._elements.length) {
            return;
        }

        const router = Router();

        app.use(controller._params.path, router);

        for (const element of controller._elements.filter(elt => elt.type !== 'app-use')) {
            const elementParams = element.params as ExpressRouterParams;
            const bindFunc = createMethodFunc(element, controller);
            if (element.type === "get") {
                router.get(elementParams.path, bindFunc);
            } else if (element.type === "post") {
                router.post(elementParams.path, bindFunc);
            } else if (element.type === "use") {
                const elementParams = element.params as ExpressRouterAppUseParams;
                const bind = (elementParams && elementParams.unless) ?
                    buildMiddleWareUnless(bindFunc).unless(elementParams.unless) : bindFunc;
                router.use(bind);
            }
        }

        for (const element of controller._elements.filter(elt => elt.type === 'app-use')) {
            const elementParams = element.params as ExpressRouterAppUseParams;
            const bindFunc = createMethodFunc(element, controller);
            const bind = (elementParams && elementParams.unless) ?
                buildMiddleWareUnless(bindFunc).unless(elementParams.unless) : bindFunc;
            app.use(bind);
        }
    }

    static getPath(controller: ExpressRouterController | any) {
        if (!controller._elements || !controller._params) {
            throw new Error("Cannot create express router, missing @Controller decorator");
        }
        return controller._params.path;
    }
}


