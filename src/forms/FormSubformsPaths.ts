import { FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormsQueryArrayFacade } from "./FormsQueryArrayFacade";

export interface FormPath {
    id: IndexType;
    path: string;
    ref?: string;
}

export interface FormSubFormsPathsConfig {
    id: IndexType;
    includePaths?: string[];
    excludePaths?: string[];
}

function isPathValid(query: string, paths: string[]) {
    for (const path of paths) {
        if (path === "*") {
            return true;
        }

        if (path.endsWith("*")) {
            const pathTrimed = path.slice(0, -1);
            if (query.startsWith(pathTrimed)) {
                return true;
            }
        } else if (path === query) {
            return true;
        }
    }

    return false;
}

export class FormSubFormsPaths {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private constructor(private config: FormSubFormsPathsConfig) { }

    static async generate(config: FormSubFormsPathsConfig): Promise<FormPath[]> {
        const subFormsPaths = new FormSubFormsPaths(config);
        return subFormsPaths.generate();
    }

    static async delete(config: FormSubFormsPathsConfig): Promise<boolean> {
        const subFormsPaths = new FormSubFormsPaths(config);
        return subFormsPaths.delete();
    }

    private async generate() {
        return this.generatePaths({ id: this.config.id, path: "$" }, []);
    }

    private async delete() {
        const paths = await this.generate();

        const formIds = paths.map(p => p.id);

        await this.formsService.deleteForms(formIds);

        console.log(formIds);

        const assocs = paths.filter(p => p.ref !== undefined).map(p => ({
            ref: p.ref,
            form: p.id,
        }));

        console.log(assocs);

        await this.formsService.deleteFormsAssocs(assocs);

        return true;
    }

    private async generatePaths(formPath: FormPath, visitedForms: IndexType[]): Promise<FormPath[]> {

        if (visitedForms.includes(formPath.id)) { // prevent cycling
            return [];
        }

        visitedForms.push(formPath.id);

        const form = await this.formsService.getForm(formPath.id);

        if (!form) {
            return [];
        }

        const paths: FormPath[] = this.isPathValid(formPath.path) ? [formPath] : [];

        const indexBlocks = FormUtils.getBlocks(form).filter(b => b.value && FormUtils.isBlockIndex(b));

        for (const indexBlock of indexBlocks) {
            const indexPaths = await this.generatePaths({
                id: indexBlock.value,
                path: `${formPath.path}.${indexBlock.field}`
            }, visitedForms);
            paths.push(...indexPaths);
        }

        const arrayBlocks = FormUtils.getBlocks(form).filter(b => FormUtils.isBlockFormArray(b));

        for (const arrayBlock of arrayBlocks) {
            const arrayPath = `${formPath.path}.${arrayBlock.field}`;
            const arrayRes = await FormsQueryArrayFacade.retrieve(form.id, arrayBlock.field, {});
            const arrayRef = FormUtils.createFormAssocRef(form.id, arrayBlock.field);
            for (const arrayResElt of arrayRes.elts) {
                const indexPaths = await this.generatePaths({
                    id: arrayResElt.id,
                    path: arrayPath,
                    ref: arrayRef
                }, visitedForms);
                paths.push(...indexPaths);
            }
        }

        return paths;
    }

    private isPathExcluded(path: string): boolean {
        return this.config.excludePaths?.length > 0 && isPathValid(path, this.config.excludePaths);
    }

    private isPathIncluded(path: string): boolean {
        return !this.config.includePaths || isPathValid(path, this.config.includePaths);
    }

    private isPathValid(path: string): boolean {
        return (!this.isPathExcluded(path) && this.isPathIncluded(path))
    }
}