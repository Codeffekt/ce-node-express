import {
    FormInstanceBase, IndexType, FormQuery,
    getProjectCreator, FormQueryField, FormUtils, FormBlock, FormInstance
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { ProjectsService } from "../services/ProjectsService";

function isQueryFieldRoot(qf: FormQueryField) {
    return qf.onMeta && qf.field === "root" && (!qf.op || qf.op === "=") && qf.value !== undefined;
}

export abstract class FormsQueryBaseFacade {

    @Inject(ProjectsService)
    protected readonly projectsService: ProjectsService;

    @Inject(FormsService)
    protected readonly formsService: FormsService;

    protected project: FormInstance;
    protected creator: FormBlock;
    protected root: FormInstanceBase;

    constructor(protected pid: IndexType, protected query: FormQuery, protected creatorId?: IndexType) { }

    protected async createProject() {
        this.project = await this.projectsService.getProject(this.pid);
    }

    protected async createRootFromMutation() {
        this.root = await this.formsService.getFormRoot(this.query.root);
        this.creator = getProjectCreator(this.project, this.root.table);
    }

    protected async createRootFromCreatorId() {
        this.creator = getProjectCreator(this.project, this.creatorId);
        this.root = await this.formsService.getFormRoot(this.creator.root);
    }

    protected async fillQueryFields() {
        this.query.ref = this.query.ref || this.creator?.params?.ref;
        this.query.limit = this.query.limit || 0;
        this.query.offset = this.query.offset || 0;

        if (this.root && this.query.extMode && !this.query.extFields) {
            this.query.extFields = FormUtils.getBlocksAsArray(this.root)
                .filter(block => FormUtils.isBlockIndex(block)).map(block => block.field);
        }
    }

    protected async createRootFromQueryFields() {
        if (!Array.isArray(this.query.queryFields)) {
            return;
        }

        const rootQueryField = this.query.queryFields
            .find(elt => isQueryFieldRoot(elt as FormQueryField)) as FormQueryField<IndexType>;

        if (rootQueryField) {
            this.query.root = rootQueryField.value;
            await this.createRootFromMutation();
        }        
    }

    protected async executeCommon() {
        await this.createProject();
        if (this.creatorId) {
            await this.createRootFromCreatorId();
        } else if (this.query.root) {
            await this.createRootFromMutation();
        } else if (this.query.queryFields) {
            await this.createRootFromQueryFields();
        }
        this.fillQueryFields();
        await this.runQuery();
    }

    protected abstract runQuery(): void;
}