import { EltNotFoundError, FormInstance, FormQuery, FormUtils, IncorrectFormatError, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class FormsQueryArrayFacade {

    @Inject(FormsService)
    protected readonly formsService: FormsService;

    private constructor(private id: IndexType, private field: IndexType, private query: FormQuery) {}

    static retrieve(id: IndexType, field: IndexType, query: FormQuery) {
        const facade = new FormsQueryArrayFacade(id, field, query);
        return facade.executeQuery();
    }

    private async executeQuery() {
        const form = await this.retrieveForm();
        const arrayQuery = this.retrieveArrayRef(form);
        return this.formsService.getFormsQuery({
            limit: 0,
            offset: 0,
            ...this.query,
            ...arrayQuery
        });
    }

    private async retrieveForm() {

        const form = await this.formsService.getForm(this.id);

        if(!form) {
            throw new EltNotFoundError(`Form ${this.id} not found`, { id: this.id });
        }

        return form;
    }

    private retrieveArrayRef(form: FormInstance): FormQuery {

        const arrayBlock = FormUtils.getBlockFromField(form, this.field);

        if(!arrayBlock) {
            throw new EltNotFoundError(`Form ${this.id} has not array block ${this.field}`, { id: this.id, field: this.field});
        }

        if(arrayBlock.type !== "formArray") {
            throw new IncorrectFormatError(`Form block ${this.field} is not of type formArray`);
        }

        if(!arrayBlock.root) {
            throw new IncorrectFormatError(`Form block ${this.field} has no root type`);
        }

        return {            
            ref: arrayBlock.params?.ref ?? FormUtils.createFormAssocRef(form.id, arrayBlock.field),
            queryFields: [{
                field: "root",
                onMeta: true,
                op: "=",
                value: arrayBlock.root
            }]
        };
    }
}