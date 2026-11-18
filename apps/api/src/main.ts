import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';

async function bootstrap() {
  // Local development: read apps/api/.env. In AWS the variables come from Secrets Manager / task config.
  try {
    process.loadEnvFile('.env');
  } catch {
    // no .env file - rely on real environment variables
  }
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  // Behind a load balancer the client address arrives in X-Forwarded-For (used for rate limits).
  if (process.env.TRUST_PROXY === 'true') app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true, exposedHeaders: ['Content-Disposition'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: true, // reject requests with unknown fields
      transform: true,
    }),
  );
  app.enableShutdownHooks();

  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BOSSONE.LK API')
      .setDescription('Wholesale salon marketplace and business management API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(env.PORT);
  Logger.log(`API running on http://localhost:${env.PORT}/api`, 'Bootstrap');
  if (env.NODE_ENV !== 'production') {
    Logger.log(`Swagger docs on http://localhost:${env.PORT}/api/docs`, 'Bootstrap');
  }
}

void bootstrap();
