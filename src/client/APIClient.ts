import Axios, { AxiosRequestConfig } from "axios";

export interface APIClientConfig {
    server: string;    
    token: string;
}

export class APIClient {

    constructor(private config: APIClientConfig) {}

    async self() {
        const res = await Axios.get(
            this.getSelf(),
            this.getHeaders()
        );
        return res.data;
    }

    getConfig() {
        return this.config;
    }

    callAPI<T = any>(moduleName, func: string, ...params: any[]): Promise<T> {
        return this.call.apply(this, [moduleName, func].concat(params));
    }

    private getApi(): string {
        return `${this.config.server}/api`;
    }

    private getSelf(): string {
        return `${this.config.server}/api/self`;
    }

    private getHeaders() {
        return {
            headers: { Authorization: `Bearer ${this.config.token}` }
        };
    }    

    private getCallPost(className: string, func: any, ...others: any[]) {

        interface CallParams {
            function: string;
            params?: any[];
        }

        interface PostMessage {
            __class: string;
            call: CallParams;
        }

        const post: PostMessage = {
            "__class": className,
            "call": { "function": func }
        };

        if (others.length > 0) { // remove null && undefined parameters in array
            post.call.params = Array.isArray(others) ? others.filter(e => e !== undefined && e !== null) : others;
        }

        return post;
    }

    private call<T>(...params: any[]): Promise<T> {
        return this._call.bind(this, this.getApi.bind(this) as any, this.getCallPost, this.getHeaders()).apply(this, params) as any;
    }

    private async _call<T>(getApiFunc: () => string, msgFunc: () => any, options: AxiosRequestConfig, ...params: any[]): Promise<T> {
        console.log("_call", getApiFunc());
        console.log("_params", msgFunc.apply(this, params as any));
        console.log(options);
        const res = await Axios.post<T>(
            getApiFunc(),
            msgFunc.apply(this, params as any),
            options
        );
        return res.data;
    }
}