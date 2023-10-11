import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ChapterService } from './components/chapter/chapter.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/data")
  async getData() {
    // return await this.chapService.addQueue();
  }
}
