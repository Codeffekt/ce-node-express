import { SimpleDBApp } from "../app/SimpleDBApp";

async function bootstrap() {

    const ECONNREFUSED = -61;

    try {

        await SimpleDBApp.init();

        await SimpleDBApp.close();    

    } catch(err) {

        if(err.errno === ECONNREFUSED) {
            console.error("Database network access refused");
            process.exit(-1);
        }

        if(err.code === "28P01") {
            console.error("Authentication failed");
            return;
        }

        if(err.code === "3D000") {
            console.error("Database does not exist");
            return;
        }

        console.log(err);
    }
   
}

bootstrap();
