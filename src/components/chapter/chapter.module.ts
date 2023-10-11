import { Module} from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { BullModule } from '@nestjs/bull';
import { ChapterConsumer, DataConsumer, DataStoriesConsumer, TeleConsumer, TeleStoriesConsumer } from '../consumer/queue.consumer';
import { HttpModule } from '@nestjs/axios';
import { redisStore } from 'cache-manager-redis-store'
import { CacheModule, CacheStore } from '@nestjs/cache-manager';

@Module({
  imports: [
    BullModule.registerQueueAsync({name: 'chapter'},{name: 'data'},{name: 'tele'},{name: "data-stories"},{name: "tele-stories"}),
    HttpModule,
  ],
  controllers: [ChapterController],
  providers: [ChapterService, ChapterConsumer, DataConsumer, TeleConsumer, DataStoriesConsumer,TeleStoriesConsumer ]
})
export class ChapterModule {}
