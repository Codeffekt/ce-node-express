import { SqlSelect, SqlSelectProps } from "./SqlSelect";

export interface SqlFromSelectProps extends SqlSelectProps {
    alias?: string;
}

export class SqlFromSelect extends SqlSelect implements SqlFromSelectProps {

    alias?: string;    

    constructor(props: SqlFromSelectProps) {
        super(props);
        this.alias = props.alias;
    }

}