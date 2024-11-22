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

        channel.consume(queue,(msg) => {
            if(!msg) {
                return;
            }

            console.log(" [x] Received %s", msg.content.toString())
        }, { noAck: true });

    } catch (error) {
        console.error(error);
    }
}

bootstrap();

