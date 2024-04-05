import { ProcessingApplication } from "../../src/servers/ProcessingApplication";
import { CeService } from "../../src/core/CeService"
import { FormsApiServer } from "../../src/servers/FormsApiServer";
import { ExpressApplication } from "../../src/services/ExpressApplication";
import { Task } from "../../src/processing/Task";

async function bootstrap() {

    await CeService.get(ExpressApplication).runAppFromEnv("Processing test", {
        routers: [
            CeService.get(FormsApiServer),
        ]
    });

    CeService.get(ProcessingApplication).runAppFromEnv({
        task: new Task("../../tests/processing/task.ts"),
        server: "http://localhost:3000",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjZS1mb3Jtcy1hcGkiLCJzdWIiOiJjb250YWN0QGNvZGVmZmVrdC5jb20iLCJ1aWQiOiJlNjZlNzViYS1jY2VlLTQxYWYtYTdmNC05NGVjYTIwNTgyMWEiLCJleHAiOjg1NTU1NDU2MzcsImlhdCI6MTcxMjIzMzYzN30.QOWwCy8LbQOduAN8IC-EGoBjY7oLpTcozy715oJHRHY"
    });

    /* CeService.get(ProcessingApplication).setConfig({
        task: new Task("../../tests/processing/task.ts"),
        server: "http://localhost:3000",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjZS1mb3Jtcy1hcGkiLCJzdWIiOiJjb250YWN0QGNvZGVmZmVrdC5jb20iLCJ1aWQiOiJkMjMwOGViNy03NzdhLTQ5MTAtYjE3ZC1iMTljNGEzNzFlOTAiLCJleHAiOjg1NTU0NDI5MDYsImlhdCI6MTcxMjEzMDkwNn0.-6Yy9Y2akqi3cOWx3YhJ6p_oDm1UoRWh5SylIuDQh8g"
    }); */

    /* await CeService.get(ProcessingApplication).test_start("fb0a3298-b490-41c5-82d7-2dd781e5442f");

    console.log("End of processing");

    await CeService.get(ExpressApplication).stop(); */
}

bootstrap();



