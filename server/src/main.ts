import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  await app.listen(process.env.PORT ?? 3000);
  setInterval(
    () => {
      const selfUrl =
        process.env.RENDER_EXTERNAL_URL ||
        `http://localhost:${process.env.PORT ?? 3000}`;
      fetch(`${selfUrl}/health`)
        .then((response) => {
          console.log(
            `[Keep-Alive] Ping ${selfUrl} - Status: ${response.status}`,
          );
        })
        .catch((error) => {
          console.error(`[Keep-Alive] Ping failed:`, error);
        });
    },
    60 * 14 * 1000,
  );
}
void bootstrap();
