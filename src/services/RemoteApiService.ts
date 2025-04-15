import {
    DbArrayRes, FormInstance,
    FormInstanceExt, FormMutate, FormQuery,
    FormRoot, IndexType,
} from "@codeffekt/ce-core-data";
import * as dotenv from "dotenv";
import { Service } from "../core/CeService";
import { APIClient, APIClientConfig } from "../client";

export type RemoteApiConfig = APIClientConfig;

@Service()
export class RemoteApiService {    

    private client: APIClient;

    constructor() { }

    initConfigFromEnv() {
        dotenv.config({ path: ".env.remote" });
        this.setConfig({
            server: process.env.SERVER_MODE ? process.env[`SERVER_${process.env.SERVER_MODE}`] : process.env.SERVER,            
            token: process.env.TOKEN
        });
    }

    setConfig(config: RemoteApiConfig) {
        this.client = new APIClient(config);        
    }

    getConfig() {
        return this.client.getConfig();
    }
    
    getProject(pid: IndexType): Promise<FormInstance> {
        return this.callProject("getProject", pid);
    }

    callProject(func: string, ...params: any[]): Promise<any> {
        return this.client.callAPI("PublicProject", func, params);
    }

    callForms(func: string, ...params: any[]): Promise<any> {
        return this.client.callAPI("PublicForms", func, params);
    }

    callFormsRoot(func: string, ...params: any[]): Promise<any> {
        return this.client.callAPI("PublicFormsRoot", func, params);
    }

    callAccounts(func: string, ...params: any[]): Promise<any> {
        return this.client.callAPI("PublicAccounts", func, params);
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

    getFormsRootQuery(query: FormQuery): Promise<DbArrayRes<FormRoot>> {
        return this.callFormsRoot("getFormsQuery", query);
    }

    updateForm(formInstance: FormInstance): Promise<any> {
        return this.callForms("update", formInstance);
    }

    formMutation(mutation: FormMutate): Promise<boolean> {
        return this.callForms("formMutation", mutation);
    }        
}