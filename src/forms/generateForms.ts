/* import { SimpleDBApp } from "../app/SimpleDBApp";

FormRootFactory.useModelsStorage(true);

import { FormRootFactory, getFormModel, PiezoDrilling, PiezoDrillingRealisation, PiezoSample, SampleBottle } from "@codeffekt/ce-core-data";

const commandLineArgs = require('command-line-args');

const USAGE = `generateForms [--list|--update] [--summary]
--list \t list all forms models declared
--update \t insert/update forms models in DB
--summary \t displays only forms ids
`;

const optionsDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'list', alias: 'l', type: Boolean },
    { name: 'update', alias: 'u', type: Boolean },
    { name: 'summary', alias: 's', type: Boolean },
];

const options = commandLineArgs(optionsDefinitions);

if (options.help || (!options.list && !options.update)) {
    console.log(USAGE);
    process.exit(0);
}

const FORMS_MODEL = [
    PiezoDrilling,    
    PiezoDrillingRealisation,
    PiezoSample,
    SampleBottle
];

async function bootstrap() {
    const db = SimpleDBApp.getFormsService();
    const formRoots = await db.getFormRoots();
    for (const model of FormRootFactory.getModels()) {
        const formEntity = new model.constr();
        const formRoot = getFormModel(formEntity);
        const existingElt = formRoots.find(elt => elt.id === formRoot.id);
        if (existingElt) {
            console.log(`Model ${formRoot.id} exists update it`);
            formRoot.ctime = existingElt.ctime;
            formRoot.mtime = Date.now();
        } else {
            console.log(`Insert new model ${formRoot.id}`);
        }
        await db.upsertFormRoot(formRoot);
    }
    SimpleDBApp.close();
}

if (options.list) {
    for (const model of FormRootFactory.getModels()) {
        const formEntity = new model.constr();
        const formModel = getFormModel(formEntity);
        if (options.summary) {
            console.log(formModel.id);
        } else {
            console.log(formModel);
        }
    }
} else if(options.update) {
    SimpleDBApp.init();
    bootstrap();
} */