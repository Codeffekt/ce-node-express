import { FormRoot } from "@codeffekt/ce-core-data";

export class Roots {

    static forms: FormRoot[] = [
        {
            "id": "forms-template",
            "ctime": 1678889271269,
            "title": "Formulaire template",
            "content": {
                "form": {
                    "type": "index",
                    "field": "form",
                    "label": "Form"
                },
                "name": {
                    "type": "text",
                    "field": "name",
                    "label": "Name"
                },
                "root": {
                    "type": "text",
                    "field": "root",
                    "label": "Root"
                }
            }
        },
        {
            "id": "forms-account",
            "ctime": 1678806237183,
            "title": "Formulaire utilisateur",
            "content": {
                "lang": {
                    "type": "text",
                    "field": "lang",
                    "label": "Langue"
                },
                "role": {
                    "type": "text",
                    "field": "role",
                    "label": "Role"
                },
                "authz": {
                    "type": "object",
                    "field": "authz",
                    "label": "Auth"
                },
                "email": {
                    "type": "text",
                    "field": "email",
                    "label": "E-mail"
                },
                "login": {
                    "type": "text",
                    "field": "login",
                    "label": "Login"
                },
                "account": {
                    "type": "text",
                    "field": "account",
                    "label": "Compte"
                },
                "lastName": {
                    "type": "text",
                    "field": "lastName",
                    "label": "Nom"
                },
                "firstName": {
                    "type": "text",
                    "field": "firstName",
                    "label": "Prénom"
                }
            }
        },
        {
            "id": "forms-project",
            "ctime": 1678806237181,
            "title": "Formulaire projet",
            "content": {
                "name": {
                    "type": "text",
                    "field": "name",
                    "label": "Nom"
                },
                "type": {
                    "type": "text",
                    "field": "type",
                    "label": "Type"
                },
                "_assets": {
                    "type": "assetArray",
                    "field": "_assets",
                    "label": "Media"
                },
                "params": {
                    "type": "object",
                    "field": "params",
                    "label": "Paramètres"
                },
                "status": {
                    "type": "text",
                    "field": "status",
                    "label": "Status"
                },
                "account": {
                    "type": "text",
                    "field": "account",
                    "label": "Compte"
                }
            }
        },
        {
            "id": "forms-sharing",
            "ctime": 1678806237163,
            "title": "Formulaire partage",
            "content": {
                "id": {
                    "type": "text",
                    "field": "id"
                },
                "form": {
                    "type": "index",
                    "field": "form"
                },
                "root": {
                    "type": "text",
                    "field": "root"
                },
                "authz": {
                    "type": "object",
                    "field": "authz"
                },
                "group": {
                    "type": "text",
                    "field": "group"
                },
                "login": {
                    "type": "text",
                    "field": "login"
                }
            }
        },
        {
            "id": "forms-processing",
            "ctime": 1678806237163,
            "title": "Formulaire Processing",
            "content": {
                "status": {
                    "type": "text",
                    "field": "status",
                    "label": "Status"
                },
                "type": {
                    "type": "text",
                    "field": "type",
                    "label": "Type"
                },
                "name": {
                    "type": "text",
                    "field": "name",
                    "label": "Name"
                },
                "description": {
                    "type": "text",
                    "field": "description",
                    "label": "Description"
                },
                "params": {
                    "type": "object",
                    "field": "params"
                },
                "message": {
                    "type": "text",
                    "field": "message",
                    "label": "Message"
                },
                "res": {
                    "type": "object",
                    "field": "res"
                },
                "progress": {
                    "type": "object",
                    "field": "progress"
                }
            }
        }
    ];

}