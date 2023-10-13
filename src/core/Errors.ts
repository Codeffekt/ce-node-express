export type FmtError = {
    errors: {
        message: string;
        extensions?: { [key: string]: any };
    }[];
};

export class StatusError extends Error {

    constructor(error: Error, public status: number) {
        super();
        this.message = error.message;
        this.name = error.name;
        this.stack = error.stack;
    }

    static getErrorFmt(err: any): FmtError {
        return err instanceof Error ? ErrorFactory.createFromError(err) : { errors: [err] };
    }
}

export class MissingTokenError extends StatusError {

    constructor(message: string) {
        super({ message, name: "MissingTokenError" }, 401);
    }
}

export class EltNotFoundError extends StatusError {
    constructor(message: string) {
        super({ message,  name: "EltNotFound" }, 404);
    }
}

export class UnauthorizedError extends StatusError {
    constructor(message: string) {
        super({ message,  name: "UnauhorizedError" }, 401);
    }
}

export class InvalidFormatError extends StatusError {
    constructor(message: string) {
        super({ message,  name: "InvalidFormatError" }, 500);
    }
}

export class ErrorFactory {
    static createFromError(error: Error): FmtError {
        return {
            errors: [{
                message: error.message,
                extensions: error
            }]
        }
    }
}