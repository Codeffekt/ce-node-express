import { 
    EltNotFoundError, 
    FormRoot, 
    FormSpaceEditorFormatContextWrapper, 
    FormSpaceEditorFormatWrapper, 
    FormSpaceEditorLayoutWrapper, 
    FormSpaceEditorNodeLayoutWrapper, 
    FormUtils, 
    IncorrectFormatError, 
    IndexType,
    SpacesEditorFormat,
    SpacesEditorFormatContext,
    SpacesEditorLayout,     
    
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsRootService } from "../services/FormsRootService";
import { FormsService } from "../services/FormsService";

export class SpacesEditorFormatBuilder {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(FormsRootService)
    private readonly formsRootService: FormsRootService;

    private projectForm: FormSpaceEditorFormatWrapper;
    private layoutForm: FormSpaceEditorLayoutWrapper;
    private roots: FormRoot[];
    private nodes: FormSpaceEditorNodeLayoutWrapper[];

    private constructor(private pid: IndexType) {}

    static async fromProject(pid: IndexType): Promise<SpacesEditorFormat> {

        const builder = new SpacesEditorFormatBuilder(pid);
        
        await builder.retrieveProject();
        
        await builder.retrieveRoots();

        await builder.retrieveLayout();

        await builder.retrieveNodes();

        return {
            context: builder.getContext(),
            forms: builder.getRoots(),
            layout: builder.getLayoutConfig(),
        };
    }

    async retrieveProject() {

        const formProject = await this.formsService.getFormQuery(this.pid, { extMode: true });

        if(!formProject) {
            throw new EltNotFoundError(`Project ${this.pid} not found`, this.pid);
        }

        this.projectForm = new FormSpaceEditorFormatWrapper(formProject);
    }

    async retrieveRoots() {

        const elts = await this.formsRootService.getFormsQuery({
            limit: 0,
            ref: this.projectForm.getRootsRef()
        });

        this.roots = elts.elts;
    }

    async retrieveLayout() {        

        const layoutForm = 
            this.projectForm.getInstanceFromField("layout");

        if(!layoutForm) {
            throw new EltNotFoundError(`Project layout not found`, this.pid);
        }

        this.layoutForm = new FormSpaceEditorLayoutWrapper(layoutForm);

    }

    async retrieveNodes() {

        const elts = await this.formsService.getFormsQuery({
            limit: 0,
            ref: this.layoutForm.getNodesRef()
        });

        this.nodes = elts.elts.map(elt => new FormSpaceEditorNodeLayoutWrapper(elt));
    }

    getContext(): SpacesEditorFormatContext {        

        const contextForm = 
            this.projectForm.getInstanceFromField("context");

        if(!contextForm) {
            throw new EltNotFoundError(`Project context not found`, this.pid);
        }

        const contextFormWrapper = new FormSpaceEditorFormatContextWrapper(contextForm);

        const entryPointBlock = FormUtils.getBlockFromField(contextFormWrapper.core, "entryPoint");
        
        if(!entryPointBlock) {
            throw new IncorrectFormatError(`Entry point block does not exists for project ${this.pid}`);
        }

        return {
            name: "Untitled",
            ctime: contextForm.ctime,
            mtime: contextForm.mtime ?? contextForm.ctime,
            author: contextForm.author,
            version: "NA",
            ...contextFormWrapper.props,
            entryPoint: entryPointBlock.root,
        };
    }

    getRoots(): FormRoot[] {
        return this.roots;
    }

    getLayoutConfig(): SpacesEditorLayout {
        return {
            nodes: this.nodes.map(node => node.props),
        };
    }
}