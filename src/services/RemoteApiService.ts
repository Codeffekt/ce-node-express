import {
    DbArrayRes, FormInstance,
    FormInstanceExt, FormQuery,
    FormRoot, IndexType,
} from "@codeffekt/ce-core-data";
import Axios, { AxiosRequestConfig } from "axios";
import * as dotenv from "dotenv";
import { Service } from "../core/CeService";

export interface RemoteApiConfig {
    server: string;
    learning: string;
    token: string;
}

@Service()
export class RemoteApiService {

    private config: RemoteApiConfig;

    constructor() { }

    initConfigFromEnv() {
        dotenv.config({ path: ".env.remote" });
        this.config = {
            server: process.env.SERVER_MODE ? process.env[`SERVER_${process.env.SERVER_MODE}`] : process.env.SERVER,
            learning: process.env.SERVER_MODE ? process.env[`LEARNING_${process.env.SERVER_MODE}`] : process.env.LEARNING,
            token: process.env.TOKEN
        };
    }

    setConfig(config: RemoteApiConfig) {
        this.config = config;
    }

    async self() {
        const res = await Axios.get(
            this.getSelf(),
            this.getHeaders()
        );
        return res.data;
    }

    getProject(pid: IndexType): Promise<FormInstance> {
        return this.callProject("getProject", pid);
    }

    callProject(func: string, ...params: any[]): Promise<any> {
        return this.call.apply(this, ["PublicProject", func].concat(params));
    }

    callForms(func: string, ...params: any[]): Promise<any> {
        return this.call.apply(this, ["PublicForms", func].concat(params));
    }

    callAccounts(func: string, ...params: any[]): Promise<any> {
        return this.call.apply(this, ["PublicAccounts", func].concat(params));
    }

    callFormsQuery(pid: IndexType, query: FormQuery) {
        return this.callProject("formsQuery", pid, query);
    }

    getFormsQuery(pid: IndexType, creator: IndexType, query: FormQuery): Promise<DbArrayRes<FormInstance>> {
        return this.callProject("getFormsQuery", pid, creator, query);
    }

    getFormsQueryGeneric(query: FormQuery): Promise<DbArrayRes<FormInstance>> {
        return this.callForms("getFormsQuery", query);
    }

    getFormQueryProject(pid: IndexType, id: IndexType, creator: IndexType, query: FormQuery): Promise<FormInstanceExt> {
        return this.callProject("getFormQuery", pid, id, creator, query);
    }

    getFormQueryGeneric(id: IndexType, query: FormQuery): Promise<FormInstance> {
        return this.callForms("getFormQuery", id, query);
    }

    getRoot(rid: IndexType): Promise<FormRoot> {
        return this.callForms("getRoot", rid);
    }

    updateForm(formInstance: FormInstance): Promise<any> {
        return this.callForms("update", formInstance);
    }

    callLearningProcess(pid: IndexType, sid: IndexType) {
        return this._call_rest_get(this.getLearningApi(`process/${pid}/${sid}`), this.getHeaders());
    }

    private call<T>(...params: any[]): Promise<T> {
        return this._call.bind(this, this.getApi.bind(this) as any, this.getCallPost, this.getHeaders()).apply(this, params) as any;
    }

    private async _call<T>(getApiFunc: () => string, msgFunc: () => any, options: AxiosRequestConfig, ...params: any[]): Promise<T> {
        const res = await Axios.post<T>(
            getApiFunc(),
            msgFunc.apply(this, params as any),
            options
        );
        return res.data;
    }

    private _call_rest_get(url: string, options: AxiosRequestConfig) {
        return Axios.get<any>(
            url,
            options
        );
    }

    private getLearningApi(endpoint: string): string {
        return `${this.config.learning}/${endpoint}`;
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

}