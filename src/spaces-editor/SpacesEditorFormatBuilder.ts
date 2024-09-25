import { 
    EltNotFoundError, 
    FormRoot, 
    FormSpaceEditorFormatContextWrapper, 
    FormSpaceEditorFormatWrapper, 
    FormSpaceEditorLayoutWrapper, 
    IndexType,
    SpacesEditorFormat,
    SpacesEditorFormatContext,
    SpacesEditorLayoutConfig,     
    
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
    private roots: FormRoot[];
    private nodes: FormSpaceEditorLayoutWrapper[];

    private constructor(private pid: IndexType) {}

    static async fromProject(pid: IndexType): Promise<SpacesEditorFormat> {

        const builder = new SpacesEditorFormatBuilder(pid);
        
        await builder.retrieveProject();
        
        await builder.retrieveRoots();

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

    async retrieveNodes() {

        const elts = await this.formsService.getFormsQuery({
            limit: 0,
            ref: this.projectForm.getNodesRef()
        });

        this.nodes = elts.elts.map(elt => new FormSpaceEditorLayoutWrapper(elt));
    }

    getContext(): SpacesEditorFormatContext {

        const contextForm = 
            this.projectForm.getInstanceFromField(this.projectForm.props.context);

        if(!contextForm) {
            throw new EltNotFoundError(`Project context not found`, this.pid);
        }

        const contextFormWrapper = new FormSpaceEditorFormatContextWrapper(contextForm);

        return {
            ctime: contextForm.ctime,
            mtime: contextForm.mtime,
            author: contextForm.author,
            ...contextFormWrapper.props
        };
    }

    getRoots(): FormRoot[] {
        return this.roots;
    }

    getLayoutConfig(): SpacesEditorLayoutConfig {
        return {
            nodes: this.nodes.map(node => node.props),
        };
    }
}