import { FormQuery } from "@codeffekt/ce-core-data";
import { FormsOperation } from "./FormsOperation";
import { Inject } from "../../core/CeService";
import { FormsService } from "../../services/FormsService";

const CHUNCK_SIZE = 10;

interface QueryPagination {
    offset: number;
    limit: number;
    total: number;
}

export class FormsOperator {

    @Inject(FormsService)
    private formsService: FormsService;

    private constructor(
        private query: FormQuery
    ) { }

    static async fromQuery(query: FormQuery, operation: FormsOperation) {
        const operator = new FormsOperator(query);
        return operator.runOperationOnQuery(operation);
    }

    private async runOperationOnQuery(operation: FormsOperation) {

        let pagination: QueryPagination = {
            offset: 0,
            limit: CHUNCK_SIZE,
            total: 0,
        };

        await this.callOperation(operation, pagination);

        while (pagination.total > pagination.offset) {
            pagination = await this.callOperation(
                operation,
                pagination
            );
        }
    }

    private async callOperation(
        operation: FormsOperation,
        pagination: QueryPagination
    ): Promise<QueryPagination> {
        const res = await this.formsService.getFormsQuery({
            ...this.query,
            ...pagination,
        });

        if (!res.elts.length) {
            return {
                offset: 0,
                limit: 0,
                total: 0
            };
        }

        await operation.operate(res);
        return {
            ...pagination,
            offset: res.offset + res.elts.length,
            total: res.total,
        };
    }
}