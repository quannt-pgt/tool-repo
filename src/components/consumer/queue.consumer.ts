import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { ChapterService } from "../chapter/chapter.service";

@Processor("chapter")
export class ChapterConsumer {
    constructor(
      private readonly chapterService: ChapterService
    ){}
    @Process('chapter-job')
    async handleChangeData(job: Job) {
      console.log('Start audio compress into mp3...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log(job.data);
      console.log('completed!!');
    }
}

@Processor("data")
export class DataConsumer {
    constructor(
      private readonly chapterService: ChapterService
    ){}

    @Process('data-job')
    async handleGetData(job: Job) {
      console.log('Start job' + job.id);
      await this.chapterService.suggestData(job?.data)
      console.log(`job ${job.id} success`)
    }
}

@Processor("data-stories")
export class DataStoriesConsumer {
    constructor(
      private readonly chapterService: ChapterService
    ){}

    @Process('data-story-job')
    async handleGetData(job: Job) {
      console.log('Start job' + job.id);
      await this.chapterService.suggestStoriesData(job?.data)
      console.log(`job ${job.id} success`)
    }
}

@Processor("tele")
export class TeleConsumer {
    constructor(
      private readonly chapterService: ChapterService
    ){}

    @Process("add-to-tele")
    async handleAddTele(job: Job) {
      console.log('Start job' + job.id);
      await this.chapterService.addMessageToTele(job?.data?.data)
      console.log(`job ${job.id} success`)
    }
}

@Processor("tele-stories")
export class TeleStoriesConsumer {
    constructor(
      private readonly chapterService: ChapterService
    ){}

    @Process("add-story-to-tele")
    async handleAddTele(job: Job) {
      console.log('Start job' + job.id);
      await this.chapterService.addMessageStoriesToTele(job?.data?.data)
      console.log(`job ${job.id} success`)
    }
}