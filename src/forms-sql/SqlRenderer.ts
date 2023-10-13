import { SqlFromTable, SqlJoinElt, SqlWhere } from "./SqlASTTypes";
import { SqlFromSelect } from "./SqlFromSelect";
import { SqlSelect } from "./SqlSelect";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic } from "./SqlWhereExprLogic";

export class SqlRenderer {    

    static renderSQLFromSqlAST(select: SqlSelect) {
        const sql = this.renderSqlSelect(select);        
        return sql;
    }

    static renderSqlSelect(select: SqlFromSelect) {
        const sqlFields = this.renderSqlSelectFields(select);
        const sqlFrom = this.renderSqlFrom(select);
        const sqlJoin = this.renderSqlJoin(select);
        const sqlWhere = this.renderSqlWhere(select);
        const sqlOrder = this.renderSqlOrder(select);
        const sqlLimit = this.renderSqlLimit(select);          
        return `${sqlFields} ${sqlFrom} ${sqlJoin} ${sqlWhere} ${sqlOrder} ${sqlLimit}`;
    }

    static renderSqlJoin(select: SqlFromSelect): string {        
        const sqlJoins = select.join?.map(join => this.renderSqlJoinElt(join)).join(" ");
        return select.join ? sqlJoins : '';
    }

    static renderSqlJoinElt(join: SqlJoinElt): string {
        return `${join.type} ${this.renderSqlFromTable(join.table)} ON ${this.renderSqlWhereExpr(join.on)}`;
    }

    static renderSqlLimit(select: SqlFromSelect) {
        if(!select.limit) {
            return '';
        }

        const limit = {
            limit: select.limit.limit || 0,
            offset: select.limit.offset || 0
        };        

        return `LIMIT ${limit.limit} OFFSET ${limit.offset}`;
    }

    static renderSqlWhere(select: SqlFromSelect) {
        if(!select.where) {
            return '';
        }
        return `WHERE ${this.renderSqlWhereExpr(select.where)}`;
    }

    static renderSqlWhereExpr(expr: SqlWhere): string {        
        if(expr instanceof SqlWhereExprElt) {

            const value = typeof expr.value === "object" ? SqlRenderer.renderSqlFromSelect(expr.value) : expr.value;            
            /* console.log((<any>expr.value) instanceof SqlSelect); */

            return `${expr.field}${expr.op}${value}`;
        } else if(expr instanceof SqlWhereExprLogic) {        
            return `(${this.renderSqlWhereExpr(expr.left)} ${expr.op} ${this.renderSqlWhereExpr(expr.right)})`;
        }
    }

    static renderSqlFromSelect(select: SqlFromSelect) {
        return `(${this.renderSqlSelect(select)})` + (select.alias ? ` ${select.alias}` : '');
    }

    static renderSqlSelectFields(select: SqlSelect) {
        const sqlFields = select.fields?.map(elt => elt.field + (elt.alias ? ` AS ${elt.alias}` : ''))
            .join(",");
        return select.fields ? `SELECT ${sqlFields}` : '';
    }

    static renderSqlFromTable(table: SqlFromTable) {
        return table.name + (table.alias ? ` ${table.alias}` : '');
    }

    static renderSqlFrom(select: SqlSelect): string {
        const sqlFroms = select.from?.map
            (from => from instanceof SqlFromSelect ? this.renderSqlFromSelect(from) :
                this.renderSqlFromTable(from)
            ).join(",");
        return select.from ? `FROM ${sqlFroms}` : '';
    }

    static renderSqlOrder(select: SqlSelect): string {
        const sqlOrders = select.order?.map(
            order => `${order.field} ${order.sort}`
        ).join(",");
        return select.order ? `ORDER BY ${sqlOrders}` : '';
    }    
}