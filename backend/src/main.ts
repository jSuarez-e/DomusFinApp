// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

/**
 * Inicializa y arranca la aplicación NestJS.
 * Configura los prefijos globales, la validación estricta de payloads con ValidationPipe,
 * la política de CORS y la documentación externa auto-generada con Swagger.
 * 
 * @returns {Promise<void>} Una promesa que se resuelve cuando el servidor arranca correctamente.
 * @throws {Error} Si ocurre un error durante la inicialización o el arranque del servidor.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefixes and configuration
  app.setGlobalPrefix('api');

  // Increase payload size limits for Base64 attachments/avatars
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));

  // Strict request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('DomusFinApp REST API')
    .setDescription('The API documentation for the DomusFinApp application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
