import { FormMutate, IndexType } from "@codeffekt/ce-core-data";
import { FormMutateFacade } from "./FormMutateFacade";

export class FormMutatesFacade {

    constructor(private pid: IndexType, private mutations: FormMutate[], private author: IndexType) {

    }

    async execute() {

        const res = [];

        for(const mutation of this.mutations) {
            const formMutate = new FormMutateFacade(this.pid, { ...mutation, author: this.author });
            res.push(await formMutate.execute());
        }

        return res;
    }
}