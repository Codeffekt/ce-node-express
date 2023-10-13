import { FormQueryField } from '@codeffekt/ce-core-data';

export interface SqlQueryFieldParent {    
    type?: 'or'|'and';
    id: string;
}

export interface SqlQueryField {
    qf: FormQueryField;
    parent: SqlQueryFieldParent;
}

export class SqlQueryFieldUtils {

    static isSameParent(a: SqlQueryFieldParent, b: SqlQueryFieldParent) {
        return a.type === 'or' && a.id === b.id;
    }

}