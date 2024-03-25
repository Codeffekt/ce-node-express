import { AccountSettings, FormAccount, FormAccountWrapper, FormInstance, IndexType } from "@codeffekt/ce-core-data";
import { FormBlockBuilder } from "../forms/FormBlockBuilder";

export class FormAccountBuilder {

    static fromAccount(account: AccountSettings, author: IndexType): FormAccountWrapper {


        const formInstance: FormInstance = {
            author: author,
            root: FormAccount.ROOT,
            title: `User {login}`,
            valid: true,
            id: account.id,
            ctime: account.ctime,
            mtime: account.mtime,
            type: FormAccount.ROOT,
            content: {
                account: FormBlockBuilder.asTextFromObj(account, "account", "Account"),
                login: FormBlockBuilder.asTextFromObj(account, "login", "Login"),
                firstName: FormBlockBuilder.asTextFromObj(account, "firstName", "Nom"),
                lastName: FormBlockBuilder.asTextFromObj(account, "lastName", "Prénom"),
                email: FormBlockBuilder.asTextFromObj(account, "email", "E-mail"),
                lang: FormBlockBuilder.asTextFromObj(account, "lang", "Langue"),
                role: FormBlockBuilder.asTextFromObj(account, "role", "Role"),
                authz: FormBlockBuilder.asObjectFromObj(account, "authz", "Auth"),
            }
        };

        return new FormAccountWrapper(formInstance);
    }    

}