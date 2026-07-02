import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Bootstraps the NestJS application.
 * Configures global settings such as CORS and raw body buffers.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  // Enable Cross-Origin Resource Sharing for frontend communication
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`ConfirmAm API running on: http://localhost:${port}`);
}
bootstrap();
