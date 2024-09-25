export const DB_TABLE_ACCOUNTS = "accounts";
export const DB_TABLE_ASSETS = "assets";
export const DB_TABLE_FORMSROOT = "formsroot";
export const DB_TABLE_FORMSROOT_ASSOC = "formsroot_assoc";
export const DB_TABLE_FORMS = "forms";
export const DB_TABLE_FORMS_ADMIN = "formsadmin";
export const DB_TABLE_FORMS_ASSOC = "forms_assoc";
export const DB_TABLE_FORMS_VERSION = "forms_version";
export const DB_TABLE_FORMS_EVENT = "forms_event";
export const DB_TABLE_FORMS_TOKEN = "forms_token";
export const DB_TABLE_PROJECTS = "projects";

export interface DbTablesOption {
    formsTableName: string;
    formsRootTableName: string;
    assocsTableName: string;
    accountsTableName: string;
    rootTableName: string;
}
