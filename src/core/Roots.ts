import { FormRoot } from "@codeffekt/ce-core-data";

export class Roots {

    static forms: FormRoot[] = [
        {
            "id": "forms-template",
            "ctime": 1678889271269,
            "title": "Formulaire template",
            "type": "forms-template",
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
            "type": "forms-account",
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
            "type": "forms-project",
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
                    "label": "Media",
                    "value": "assets-{$id}"
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
            "id": "forms-project-template",
            "ctime": 1639560491556,
            "mtime": 1665416455851,
            "title": "Modèle de projet",
            "type": "forms-project-template",
            "content": {
                "name": {
                    "type": "text",
                    "field": "name",
                    "label": "Name"
                },
                "type": {
                    "type": "text",
                    "field": "type",
                    "label": "Type"
                },
                "_assets": {
                    "type": "assetArray",
                    "field": "_assets",
                    "label": "Media",
                    "value": "assets-{$id}"
                },
                "account": {
                    "type": "text",
                    "field": "account",
                    "label": "Compte"
                },
                "status": {
                    "type": "text",
                    "field": "status",
                    "label": "Status"
                },
                "params": {
                    "type": "object",
                    "field": "params",
                    "label": "Params"
                }
            }
        },
        {
            "id": "forms-sharing",
            "ctime": 1678806237163,
            "title": "Formulaire partage",
            "type": "forms-sharing",
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
            "type": "forms-processing",
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
        },
        {
            "id": "forms-mask",
            "ctime": 1620049568340,
            "mtime": 1665653692841,
            "title": "Mask",
            "type": "forms-mask",
            "content": {
                "mask": {
                    "type": "mask",
                    "field": "mask",
                    "label": "Mask"
                },
                "root": {
                    "type": "index",
                    "field": "root",
                    "label": "Root"
                },
                "style": {
                    "type": "style",
                    "field": "style",
                    "label": "Style"
                },
                "category": {
                    "type": "index",
                    "field": "category",
                    "label": "Category"
                },
                "disabled": {
                    "type": "boolean",
                    "field": "disabled",
                    "label": "Disabled"
                }
            }
        },
        {
            "id": "forms-style",
            "ctime": 1620049568340,
            "title": "Style",
            "type": "forms-style",
            "content": {
                "root": {
                    "type": "index",
                    "field": "root",
                    "label": "Root"
                },
                "style": {
                    "type": "style",
                    "field": "style",
                    "label": "Style"
                },
                "category": {
                    "type": "index",
                    "field": "category",
                    "label": "Category"
                },
                "disabled": {
                    "type": "boolean",
                    "field": "disabled",
                    "label": "Disabled"
                }
            }
        },
        {
            "id": "forms-app",
            "ctime": 1639560491556,
            "mtime": 1665653546119,
            "title": "Application",
            "type": "forms-app",
            "content": {
                "name": {
                    "type": "text",
                    "field": "name",
                    "label": "Name"
                },
                "type": {
                    "type": "text",
                    "field": "type",
                    "label": "Type"
                },
                "masks": {
                    "root": "forms-mask",
                    "type": "formAssoc",
                    "field": "masks",
                    "label": "Masques",
                    "params": {
                        "fields": [
                            "root",
                            "category"
                        ]
                    }
                },
                "title": {
                    "type": "text",
                    "field": "title",
                    "label": "Title"
                },
                "styles": {
                    "root": "forms-style",
                    "type": "formAssoc",
                    "field": "styles",
                    "label": "Styles",
                    "params": {
                        "fields": [
                            "root",
                            "category"
                        ]
                    }
                },
                "category": {
                    "type": "text",
                    "field": "category",
                    "label": "Category"
                },
                "description": {
                    "type": "text",
                    "field": "description",
                    "label": "Description"
                }
            }
        },
        {
            "id": "forms-export",
            "ctime": 1641285670088,
            "mtime": 1641399335789,
            "title": "Formulaire Export",
            "type": "forms-export",
            "content": {
                "cols": {
                    "type": "object",
                    "field": "cols",
                    "label": "Cols",
                    "defaultValue": []
                },
                "name": {
                    "type": "text",
                    "field": "name",
                    "label": "Nom"
                },
                "rowsQuery": {
                    "type": "object",
                    "field": "rowsQuery",
                    "label": "RowsQuery",
                    "defaultValue": {}
                }
            }
        }
    ];

}