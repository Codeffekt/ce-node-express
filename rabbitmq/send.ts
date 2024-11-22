import { connect } from "amqplib";

console.log("Hello world !");

async function bootstrap() {
    try {
        const connection = await connect(
            'amqp://guest:guest@127.0.0.1:5672'
        );

        console.log(`✅ Rabbit MQ Connection is ready`);

        const queue = "hello";

        const channel = await connection.createChannel();

        console.log(`🛸 Created RabbitMQ Channel successfully`);

        channel.assertQueue(queue, {
            durable: false
        });

        channel.sendToQueue(queue, Buffer.from("Hello World !"));

        setTimeout(function() {
            connection.close();
            process.exit(0)
          }, 500);

    } catch (error) {
        console.error(error);
    }
}

bootstrap();

