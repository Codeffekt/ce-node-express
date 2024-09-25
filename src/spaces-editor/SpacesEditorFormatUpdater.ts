import {
    EltNotFoundError, FormAssoc, FormSpaceEditorFormatWrapper,
    FormSpaceEditorLayoutWrapper, FormSpaceEditorNodeLayout,
    FormWrapper, IndexType, SpacesEditorFormat
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormsRootService } from "../services/FormsRootService";

export class SpacesEditorFormatUpdater {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(FormsRootService)
    private readonly formsRootService: FormsRootService;

    private projectForm: FormSpaceEditorFormatWrapper;
    private layoutForm: FormSpaceEditorLayoutWrapper;

    private constructor(
        private pid: IndexType,
        private format: SpacesEditorFormat,
        private author: IndexType) {

    }

    static async update(id: IndexType, format: SpacesEditorFormat, author: IndexType): Promise<boolean> {

        const updater = new SpacesEditorFormatUpdater(id, format, author);

        await updater.retrieveProject();
        await updater.retrieveLayout();
        await updater.updateContext();
        await updater.updateLayouts();
        await updater.updateRoots();

        return true;
    }

    async retrieveProject() {

        const formProject = await this.formsService.getFormQuery(this.pid, { extMode: true });

        if (!formProject) {
            throw new EltNotFoundError(`Project ${this.pid} not found`, this.pid);
        }

        this.projectForm = new FormSpaceEditorFormatWrapper(formProject);
    }

    async retrieveLayout() {

        const layoutForm =
            this.projectForm.getInstanceFromField("layout");

        if (!layoutForm) {
            throw new EltNotFoundError(`Project layout not found`, this.pid);
        }

        this.layoutForm = new FormSpaceEditorLayoutWrapper(layoutForm);

    }

    async updateContext() {

        const contextForm =
            this.projectForm.getInstanceFromField("context");

        if (!contextForm) {
            throw new EltNotFoundError(`Project context not found`, this.pid);
        }

        FormWrapper.setFormValues(this.format.context, contextForm);

        await this.formsService.updateForm(contextForm, this.author);
    }

    async updateLayouts() {

        const elts = await this.formsService.getFormsQuery({
            limit: 0,
            ref: this.layoutForm.getNodesRef()
        });

        await this.formsService.deleteForms(elts.elts.map(elt => elt.id));
        await this.formsService.deleteFormsAssoc(this.layoutForm.getNodesRef());

        const nodeLayoutRoot = await this.formsService.getFormRoot(FormSpaceEditorNodeLayout.ROOT);

        if (!nodeLayoutRoot) {
            throw new EltNotFoundError(`Form root ${FormSpaceEditorNodeLayout.ROOT} not found`, {});
        }

        const newNodes = this.format.layout.nodes.map(node => {
            const newForm = this.formsService.createForm(nodeLayoutRoot, this.author);
            FormWrapper.setFormValues(node, newForm);
            return newForm;
        });

        await this.formsService.insertForms(newNodes, this.author);
        await this.formsService.insertFormsAssoc(
            newNodes.map(newNode => ({
                ref: this.layoutForm.getNodesRef(),
                form: newNode.id
            }))
        );
    }

    async updateRoots() {

        await this.formsRootService.deleteFormsAssoc(this.projectForm.getRootsRef());        

        for (const root of this.format.forms) {
            await this.formsService.upsertFormRoot(root);
        }

        await this.formsRootService.insertFormsAssoc(
            this.format.forms.map(form => ({
                ref: this.projectForm.getRootsRef(),
                form: form.id
            }))
        );
    }
}