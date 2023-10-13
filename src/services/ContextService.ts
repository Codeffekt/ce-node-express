import { 
    CoreIndexElt, FormInstance, FormInstanceExt, FormRoot, IndexType, Utils } from "@codeffekt/ce-core-data";
import * as chalk from "chalk";
import { v4 as uuidv4 } from 'uuid';
import { Service } from "../core/CeService";

@Service()
export class ContextService {

    private root: string = "data/";

    private altColors = [chalk.hex("#aaffff"), chalk.hex("#ffaaff"), chalk.hex("#ffffaa")];
    private curAltColor = 0;
    private warnColor = chalk.keyword("orange");
    private infoColor = chalk.keyword("green");

    constructor() {
    }    

    createUnique(prefix = "") {
        return uuidv4();
    }

    createCore(prefix = ""): CoreIndexElt {
        return { id: this.createUnique(prefix), ctime: Date.now() };
    }

    sanitizeForm(form: FormInstanceExt, author?: IndexType, mtime?: number) {
        return {
            ...form,
            forms: undefined,
            fields: undefined,
            mtime,
            author: form.author ? form.author : author
        } as any;
    }

    sanitizeFormRoot(form: FormRoot, mtime?: number) {
        return {
            ...form,
            mtime,
        } as any;
    }

    copyForm(form: FormInstanceExt, author?: IndexType): FormInstance {
        return {
            ...Utils.deepcopy(this.sanitizeForm(form, author)),
            ...this.createCore()
        };
    }

    cloneForm(form: FormInstanceExt, author?: IndexType): FormInstance {
        return Utils.deepcopy(this.sanitizeForm(form, author));
    }

    setRoot(root: string) {
        this.root = root;
    }

    getRoot() {
        return this.root;
    }

    getStoragePath() {
        return this.getRoot() + "storage/";
    }

    logInfo(msg: string, maxLength?: number) {        
        console.log(this.infoColor(maxLength && msg.length > maxLength ? `${msg.slice(0, maxLength)}...` : msg));
    }

    logWarning(msg: string) {
        console.log(this.warnColor(msg));
    }

    logAlt(msg: string) {
        console.log(this.altColors[this.curAltColor](msg));
        this.curAltColor = (this.curAltColor + 1) % this.altColors.length;
    }    
}
