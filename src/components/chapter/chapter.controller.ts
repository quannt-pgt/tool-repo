import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { HttpService } from '@nestjs/axios';

@Controller('chapter')
export class ChapterController {
    constructor(
        private readonly chapservice: ChapterService,
        private readonly httpService: HttpService
    ){}

    @Post("/super-job")
    async superJob(){
        return await this.chapservice.superJob()
    }

    @Get("/")
    async health(){
        return "app working"
    }

    @Get("/detail/idTruyen/:idTruyen/idChuong/:idChuong/storyId/:storyId/id/:id")
    async pageDetail(
        @Param('idTruyen') idTruyen: any,
        @Param('idChuong') idChuong: any,
        @Param('storyId') storyId: any,
        @Param('id') id: any,
    ){
       return await this.chapservice.detailContent(idTruyen, idChuong, storyId, id)
    }

    @Get("/vip/storyId/:storyId/id/:id")
    async pageDetailVip(
        @Param('storyId') storyId: any,
        @Param('id') id: any,
    ){
       return await this.chapservice.detailContentVip(storyId, id)
    }

    @Post("/stories")
    async stories(){
        return await this.chapservice.getStories()
    }

    @Get("/stories-list-file")
    async getFilestories(
      @Res() response: Response
    ){
        return await this.chapservice.getStoriesFile(response)
    }

    @Get("/chapter-list-file")
    async getFileChapter(
      @Res() response: Response
    ){
        return await this.chapservice.getChapterFile(response)
    }
}
