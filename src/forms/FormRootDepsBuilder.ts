import { DbArrayRes, FormRoot, FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsRootService } from "../services/FormsRootService";

export class FormRootDepsBuilder {

    @Inject(FormsRootService)
    private readonly formsService: FormsRootService;

    private constructor(private root: IndexType) {}

    static fromRoot(root: IndexType) {

        const builder = new FormRootDepsBuilder(root);

        console.log("fromRoot", root);

        return builder.getFormWithDeps();
    }

    private async getFormWithDeps(): Promise<DbArrayRes<FormRoot>> {

        const formRoot = await this.formsService.getFormRoot(this.root);

        console.log("getFormWithDeps", formRoot);

        const elts = await this.findFormDeps(formRoot, [ formRoot ]);

        return {
            elts,
            limit: 0,
            offset: 0,
            total: elts.length
        };
    }

    private async findFormDeps(root: FormRoot, curList: FormRoot[]): Promise<FormRoot[]> {
        const elts = FormUtils.getBlocks(root)
            .filter(block => FormUtils.isBlockFormArray(block) || FormUtils.isBlockIndex(block))
            .filter(block => block.root !== undefined && !curList.find(elt => elt.id === block.root))
            .map(block => block.root!);

        console.log("findFormDeps", elts, root, curList);

        const res = await this.formsService.getFormsQuery({
            indices: elts
        });

        for(const elt of res.elts) {
            curList = await this.findFormDeps(elt, [ elt, ...curList ]);        
        }

        return curList; 
    }
}