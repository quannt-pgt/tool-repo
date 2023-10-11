import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ChapterModule } from './components/chapter/chapter.module';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: 'localhost',
          port: 6379
        }
      })
    }),
    CacheModule.register({
      isGlobal: true,
      store:  redisStore as unknown as CacheStore,
      host: "localhost",
      port: 6379,
      ttl: 86400
    }),
    ChapterModule
  ],
})
export class AppModule {}
