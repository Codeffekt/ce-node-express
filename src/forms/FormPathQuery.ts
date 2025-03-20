import { IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { SqlGraphNodeContext } from "../forms-sql";
import { FormsService } from "../services";

/**
 * Path is on the form
 * id: <formid>
 * path: <rootid>#<array field<,<rootid>#<array field>... 
 */
export class FormPathQuery {

    @Inject(FormsService)
    private readonly formsService: FormsService;
    
    private contexts: SqlGraphNodeContext[];

    private constructor(private formId: IndexType, private path: string) {
        this.buildContexts();
    }

    static fromPath(id: IndexType, path: string) {
        const pathQuery = new FormPathQuery(id, path);
        return pathQuery.runQuery();
    }

    private buildContexts() {
        const elts = this.path.split(",");

        if(elts.length < 1) {
            throw new Error("Path must have at minimum 1 part");
        }
        
        this.contexts = elts.map((elt, idx) => this.createNodeContext(elt, `tbl_${idx}`));
    }

    public runQuery() {
        return this.formsService.queryGraphNode(this.contexts, this.formId);
    }

    private createNodeContext(elt: string, alias: string): SqlGraphNodeContext {
        const parts = elt.split('#');
        return {
            root: parts[0],
            field: parts[1],
            alias
        };
    }
}