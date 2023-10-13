import {
    SqlJoinElt,
    SqlJoins,
    SqlLimit,
    SqlOrder, SqlOrderElt, SqlSelectFields,
    SqlSelectFieldsElt,
    SqlWhere
} from "./SqlASTTypes";
import { SqlFrom, SqlFromElt } from "./SqlFrom";
import { SqlWhereExprLogic, SqlWhereExprLogicOp } from "./SqlWhereExprLogic";

export interface SqlSelectProps {
    fields: SqlSelectFields;
    from?: SqlFrom;
    join?: SqlJoins;
    where?: SqlWhere;
    order?: SqlOrder;
}

export class SqlSelect implements SqlSelectProps {

    fields: SqlSelectFields;
    from?: SqlFrom;
    join?: SqlJoins;
    where?: SqlWhere;
    order?: SqlOrder;
    limit?: SqlLimit;

    constructor(props: SqlSelectProps) {
        Object.assign(this, props);
    }

    addField(elt: SqlSelectFieldsElt) {
        if (!this.fields) {
            this.fields = [];
        }
        this.fields.push(elt);
        return this;
    }

    addFrom<T extends SqlFromElt>(elt: T) {

        if(this.haveFrom(elt)) {
            return;
        }

        if (!this.from) {
            this.from = [];
        }        
        this.from.push(elt);
    }

    haveFrom(elt: SqlFromElt) {
        return elt.alias && this.from.findIndex(f => f.alias === elt.alias) !== -1;
    }

    addJoin(elt: SqlJoinElt) {
        if(!this.join) {
            this.join = [];
        }
        this.join.push(elt);
    }

    setWhereRoot<T extends SqlWhere>(elt: T) {
        this.where = elt;
    }

    addWhereAnd<T extends SqlWhere>(elt: T) {
        this.addWhereOp(elt, "and");
    }

    addWhereOr<T extends SqlWhere>(elt: T) {
        this.addWhereOp(elt, "or");
    }

    addWhereOp<T extends SqlWhere>(elt: T, op: SqlWhereExprLogicOp) {
        if (!this.where) {
            this.where = elt;
        } else {
            this.where = new SqlWhereExprLogic({
                left: this.where,
                op: op,
                right: elt
            });
        }
    }

    addOrder(elt: SqlOrderElt) {
        if (!this.order) {
            this.order = [];
        }
        this.order.push(elt);
    }

    setLimit(elt: SqlLimit) {
        this.limit = elt;
    }
}