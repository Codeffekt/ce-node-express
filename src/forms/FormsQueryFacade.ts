import {
    DbArrayRes, FormInstance,
    FormInstanceExt, IndexType,
    FormQuery, FormInstanceBase, FormUtils,    
} from "@codeffekt/ce-core-data";
import { FormsQueryBaseFacade } from "./FormQueryBaseFacade";

const MAX_EXT_SUB_FIELDS = 4;

export class FormsQueryFacade extends FormsQueryBaseFacade {    

    private forms: DbArrayRes<FormInstance | FormInstanceExt>;

    constructor(pid: IndexType, query: FormQuery, table?: IndexType) {
        super(pid, query, table || query.table);
    }

    async execute() {
        await super.executeCommon();
        await this.fillSubFields();
        return this.forms;
    }

    protected async createProject() {
        this.project = await this.projectsService.getProject(this.pid);
    }

    protected async runQuery() {
        this.forms = await this.formsService.getFormsQuery(this.query);
    }

    private async fillSubFields() {
        if (this.query.extMode && this.query.extSubFields && this.query.extSubFields.length <= MAX_EXT_SUB_FIELDS) {
            const indices: IndexType[] = [];
            this.forms.elts.forEach((_: FormInstanceExt) => {
                this.query.extSubFields.forEach(__ => {
                    const pair = __.split(".", 2);
                    if (pair.length === 2) {
                        const fieldElt = _.fields[pair[0]] as FormInstanceBase;
                        if (fieldElt !== undefined) {
                            const blockElt = FormUtils.getBlockFromField(fieldElt, pair[1]);
                            if (blockElt && FormUtils.isBlockIndex(blockElt) && blockElt.value) {
                                indices.push(blockElt.value);
                            }
                        }
                    }
                });
            });

            if(indices.length) {
                const subEltsRes = await this.formsService.getFormsQuery({ indices });
                this.forms.subElts = subEltsRes.elts;
            }
       
        }
    }
}