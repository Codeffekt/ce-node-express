import {
  IndexType, FormRoot, ROLE_CREATE,
  FormInstanceExt, FormInstance,
  DbArrayRes, FormQuery, FormMutate,
  EltNotFoundError
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { 
  CeApiAccountId, CeApiAdmin, 
  CeApiBinds, CeApiCall, 
  CeApiComponent, CeApiRole 
} from "../express-router/ApiModule";
import { FormMutateFacade } from "../forms/FormMutateFacade";
import { FormsService } from "../services/FormsService";
import { FormUpdateFacade } from "../forms/FormUpdateFacade";
import { FormCopyFacade } from "./FormCopyFacade";
import { FormsRootService } from "../services/FormsRootService";
import { FormCreateFromRootFacade } from "./FormCreateFromRootFacade";
import { FormsQueryArrayFacade } from "./FormsQueryArrayFacade";

@CeApiComponent()
export class PublicForms {

  @Inject(FormsService)
  private readonly formsService: FormsService;

  @Inject(FormsRootService)
  private readonly formsRootService: FormsRootService;

  constructor() { }

  @CeApiCall
  async getRoot(id: IndexType): Promise<FormRoot> {
    const root = await this.formsService.getFormRoot(id);
    if(root === undefined) {
      throw new EltNotFoundError(`Root ${id} not found`, { root: id });
    }
    return root;
  }

  @CeApiCall
  get(id: IndexType) {
    return this.formsService.getForm(id);
  }

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  @CeApiBinds
  async copy(@CeApiAccountId id: IndexType, src: IndexType) {
    const creator = new FormCopyFacade();
    return creator.copy(src, id);    
  }

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  @CeApiBinds
  async create(@CeApiAccountId id: IndexType, root: IndexType, partialContent?: any) {
    return FormCreateFromRootFacade.fromPartialContent(root, id, partialContent);
  }  

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  @CeApiBinds
  update(@CeApiAccountId id: IndexType, elt: FormInstanceExt) {
    const updater = new FormUpdateFacade();
    return updater.executeFromForm(elt, id);    
  }

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  @CeApiBinds
  async updateForms(@CeApiAccountId id: IndexType, elts: FormInstanceExt[]) {
    const updater = new FormUpdateFacade();
    return updater.executeFromForms(elts, id);   
  }

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  @CeApiBinds
  async updateFormsFromAssoc(@CeApiAccountId id: IndexType, ref: IndexType, elts: FormInstance[]) {
    const updater = new FormUpdateFacade();
    return updater.executeFromAssoc(elts, ref, id);   
  }

  @CeApiCall
  @CeApiAdmin
  @CeApiBinds
  updateRoot(@CeApiAccountId id: IndexType, elt: FormRoot): Promise<FormRoot> {
    return this.formsRootService.upsertFormRoot(elt, id);
  }

  @CeApiCall
  @CeApiAdmin
  deleteFormRoot(id: IndexType): Promise<boolean> {
    return this.formsService.deleteFormRoot(id);
  }

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  deleteForm(id: IndexType): Promise<boolean> {
    return this.formsService.deleteForms([id]);
  }  

  @CeApiCall
  getFormsFromAssoc(ref: IndexType, limit: number, offset: number): Promise<DbArrayRes<FormInstance>> {
    return this.formsService.getFormsFromAssoc({ ref: ref, limit: limit, offset: offset });
  }

  @CeApiCall
  getFormsQuery(query: FormQuery) {    
    return this.formsService.getFormsQuery({ limit: 0, offset: 0, ...query });
  }

  @CeApiCall
  getFormsQueryArray(id: IndexType, field: IndexType, query: FormQuery): Promise<DbArrayRes<FormInstance>> {
    return FormsQueryArrayFacade.retrieve(id, field, query);
  }

  @CeApiCall
  getFormQuery(id: IndexType, query: FormQuery) {
    return this.formsService.getFormQuery(id, query);
  }

  @CeApiCall
  getFormsRootQuery(query: FormQuery): Promise<DbArrayRes<FormRoot>> {
    return this.formsRootService.getFormsQuery(query);
  }

  @CeApiCall
  async deleteFormsQuery(query: FormQuery): Promise<boolean> {
    return this.formsService.deleteFormsQuery(query);
  }

  @CeApiCall
  @CeApiRole(
    ROLE_CREATE)
  @CeApiBinds
  async formMutation(@CeApiAccountId id, mutation: FormMutate) {
    const formMutate = new FormMutateFacade(undefined, {
      author: id,
      ...mutation,
    });
    return formMutate.execute();
  }
}

