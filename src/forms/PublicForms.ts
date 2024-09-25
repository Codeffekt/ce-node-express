import {
  IndexType, FormRoot, ROLE_CREATE,
  FormInstanceExt, FormInstance,
  DbArrayRes, FormQuery, FormMutate
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

@CeApiComponent()
export class PublicForms {

  @Inject(FormsService)
  private readonly formsService: FormsService;

  @Inject(FormsRootService)
  private readonly formsRootService: FormsRootService;

  constructor() { }

  @CeApiCall
  getRoot(id: IndexType): Promise<FormRoot> {
    return this.formsService.getFormRoot(id);
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
    const creator = new FormCreateFromRootFacade();
    return creator.createFromRoot(root, partialContent, id);    
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
  updateRoot(elt: FormRoot): Promise<FormRoot> {
    return this.formsService.upsertFormRoot(this.formsService.sanitizeFormRoot(elt, Date.now()));
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
  @CeApiAdmin  
  async formMutation(mutation: FormMutate) {
    const formMutate = new FormMutateFacade(undefined, mutation);
    return formMutate.execute();
  }
}

