import { SqlFromTable } from "./SqlASTTypes";
import { SqlFromSelect } from "./SqlFromSelect";

export type SqlFromElt = SqlFromSelect | SqlFromTable;
export type SqlFrom = SqlFromElt[];