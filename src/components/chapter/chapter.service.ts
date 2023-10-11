import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { config } from 'dotenv';
import { mariadbConnection } from 'src/mariadb.config';
const TelegramBot = require('node-telegram-bot-api');
import * as TelegramBot from 'node-telegram-bot-api';
import { cwd } from 'process';
import * as fs from "fs";
import { AxiosRequestConfig } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);

@Injectable()
export class ChapterService {
  private bot: TelegramBot;
  constructor(
    @InjectQueue("chapter") private readonly chapterJobQueue: Queue,
    @InjectQueue("data") private readonly dataJobQueue: Queue,
    @InjectQueue("tele") private readonly teleJobQueue: Queue,
    @InjectQueue("data-stories") private readonly dataStoriesJobQueue: Queue,
    @InjectQueue("tele-stories") private readonly teleStoriesJobQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
    this.bot.on('message', (msg) => {
      console.log(msg)
    });
  }

  async suggestData(job:any) {
    const data:any =  await this.getDataWithLimit(job?.data?.limit, job?.data?.offset);
    for (const item of data) {
        await this.teleJobQueue.add("add-to-tele", {
          data: item
        });
      }
  }

  async suggestStoriesData(job:any) {
    const data:any =  await this.getDataStoriesWithLimit(job?.data?.limit, job?.data?.offset);
    for (const item of data) {
        await this.teleStoriesJobQueue.add("add-story-to-tele", {
          data: item
        });
      }
  }

  

  async addMessageToTele(data:any) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        let labelKey = "";
        if(data?.embed_link !== null) {
          const tempName = await this.extraName(data?.embed_link)
          labelKey = `${tempName.host}_${tempName.idtruyen}_${tempName.idchuong}_${data?.story_id}_${data?.id}`;
        } else {
          labelKey = `vip_${data?.story_id}_${data?.id}`;
        }
        const tempFileName =`${cwd()}/src/components/chapter/doc/${labelKey}.txt`
        await fs.writeFileSync(tempFileName, data.content);
        const dataSave = await this.bot.sendDocument(process.env.TELEGRAM_BOT_ID, tempFileName, {
          caption: `
    Title:  ${data?.name}
    ChapterId: ${data?.id}
    ChapId: ${data?.story_id}
    Code:${labelKey}`,
          document: tempFileName,
        });
        fs.unlinkSync(tempFileName);
    
        const fileUrl = `${cwd()}/src/components/chapter/database.txt`; 
        const fileDes = fs.readFileSync(fileUrl, 'utf8');
        const checkFileUrl = await this.getLines(data?.id, data?.story_id);
        const fileContent = `${labelKey}: ${dataSave?.document?.file_id}\n`
        if(checkFileUrl !== "") {
           const updatedContent = fileDes.replace(checkFileUrl, fileContent);
           fs.writeFileSync(fileUrl, updatedContent);
        }else {
          fs.appendFileSync(fileUrl, fileContent);
        }
        await this.updateContentToNullById(data?.id)
    } catch(e) {
        console.log(e)
    }
  }

  async addMessageStoriesToTele(data:any) {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        let labelKey = data?.idhost;
        const dataFile = `
          id: ${data?.id},
          name: ${data?.name},
          description: "${data?.description}",
          user_id: ${data?.user_id},
          type: ${data?.type},
          is_vip: ${data?.is_vip},
          status: ${data?.status},
          origin: ${data?.origin},
          related_stories: ${data?.related_stories},
          created_at: ${data?.created_at},
          updated_at: ${data?.updated_at},
          avatar: ${data?.avatar},
          author: ${data?.author},
          author_vi: ${data?.author_vi},
          name_chines: ${data?.name_chines},
          donate: ${data?.donate},
          mod_id: ${data?.mod_id},
          view: ${data?.view},
          chapters_json: ${data?.chapters_json},
          tags: ${data?.tags}
          view_day: ${data?.view_day},
          view_week: ${data?.view_week},
          complete_free: ${data?.complete_free},
          count_chapters: ${data?.count_chapters},
          whishlist_count: ${data?.whishlist_count},
          follow_count: ${data?.follow_count},
          chapter_updated: ${data?.chapter_updated},
          host: ${data?.host},
          idhost: ${data?.idhost},
          nomination: ${data?.nomination},
          audio_month: ${data?.audio_month}
        `
        const tempFileName =`${cwd()}/src/components/chapter/doc/stories_host_${labelKey}.txt`
        await fs.writeFileSync(tempFileName, dataFile);
        const dataSave = await this.bot.sendDocument(process.env.TELEGRAM_STORIES_ID, tempFileName, {
          caption: `
    Title:  ${data?.name}
    Host: ${data?.host}
    Code:stories_host_${labelKey}`,
          document: tempFileName,
        });
        fs.unlinkSync(tempFileName);
    
        const fileUrl = `${cwd()}/src/components/chapter/stories.txt`; 
        const fileContent = `${labelKey}: ${dataSave?.document?.file_id}\n`
        fs.appendFileSync(fileUrl, fileContent);
    } catch(e) {
        console.log(e)
    }
  }

  async countData(entity: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      mariadbConnection.query(
        `SELECT COUNT(*) AS total FROM ${entity}`,
        (error: any, results: any) => {
          if (error) {
            reject(error);
          } else {
            const total = results[0].total;
            resolve(total);
          }
        },
      );
    });
  }

  async getDataWithLimit(limit: any, offset:any) {
    return new Promise((resolve, reject) => {
      mariadbConnection.query(
        'SELECT id, story_id, name, content, embed_link FROM chapters WHERE content IS NOT NULL LIMIT ? OFFSET ?',
        [limit, offset * limit],
        (error, results) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results);
        },
      );
    });
  }

  async getDataStoriesWithLimit(limit: any, offset:any) {
    return new Promise((resolve, reject) => {
      mariadbConnection.query(
        'SELECT * FROM stories LIMIT ? OFFSET ?',
        [limit, offset * limit],
        (error, results) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results);
        },
      );
    });
  }

  async getFileById(fileId: string) { 

    try {
        const fileInfo = await this.bot.getFile(fileId);
  
        if (fileInfo && fileInfo.file_path) {
          const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${fileInfo.file_path}`;
          const response:any = await fetch(fileUrl);
          const fileData = await response.arrayBuffer();
  
          const fileContent = Buffer.from(fileData).toString('utf-8');
          return fileContent
        } else {
         return {
            status: 500,
            data: 'Không thể lấy thông tin về tệp từ Telegram API'
         }
        }
      } catch (error) {
        throw new Error(`Lỗi khi tải tệp từ Telegram: ${error.message}`);
      }
  }

  async superJob() {
    const countData:any = await this.countData("chapters");
    const countStep = Math.ceil(countData / 20)

    for(let i = 0; i <= countStep; i++) {
        await this.dataJobQueue.add("data-job", {
            data: {
                limit: 20,
                offset: i
            }
        })
    }
  }

  async getLines(chapterId, storyId) {
    const searchText = `Chapter${chapterId}Story${storyId}`;
      
    const filePath = `${cwd()}/src/components/chapter/database.txt`;
    let found = false;
    let textValue = "";

    const data = await readFileAsync(filePath, 'utf8');
    const lines = data.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        textValue = lines[i];
        found = true;
        break;
      }
    }

    if (!found) {
      return "";
    }

    return textValue;
  }

  async  detailContent(idTruyen, idChuong, storyId, id) {
    try {
      const searchText = `${idTruyen}_${idChuong}_${storyId}_${id}`;
      
      const filePath = `${cwd()}/src/components/chapter/database.txt`;
      let found = false;
      let textValue = "";
  
      const data = await readFileAsync(filePath, 'utf8');
      const lines = data.split('\n');
  
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchText)) {
          textValue = lines[i];
          found = true;
          break;
        }
      }
  
      if (!found) {
        return (`Văn bản "${searchText}" không tồn tại trong file.`);
      }
      const parts = textValue.split(":");
      const cacheData = await this.cacheService.get(parts[1].trim());
      if(cacheData) {
        return cacheData;
      }
      const dataFile = await this.getFileById(parts[1].trim());
      await this.cacheService.set(parts[1].trim(), dataFile)
      return dataFile
    } catch (e) {
      console.error(e);
    }
  }

  async  detailContentVip( storyId, id) {
    try {
      const searchText = `vip_${storyId}_${id}`;
      
      const filePath = `${cwd()}/src/components/chapter/database.txt`;
      let found = false;
      let textValue = "";
  
      const data = await readFileAsync(filePath, 'utf8');
      const lines = data.split('\n');
  
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchText)) {
          textValue = lines[i];
          found = true;
          break;
        }
      }
  
      if (!found) {
        return (`Văn bản "${searchText}" không tồn tại trong file.`);
      }
      const parts = textValue.split(":");
      const cacheData = await this.cacheService.get(parts[1].trim());
      if(cacheData) {
        return cacheData;
      }
      const dataFile = await this.getFileById(parts[1].trim());
      await this.cacheService.set(parts[1].trim(), dataFile)
      return dataFile
    } catch (e) {
      console.error(e);
    }
  }

  async updateContentToNullById(id) {
  return new Promise((resolve, reject) => {
    mariadbConnection.query(
      'UPDATE chapters SET content = NULL WHERE id = ?',
      [id],
      (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      }
    );
  });
  }

  async getUpdatedJob() {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      return new Promise((resolve, reject) => {
    mariadbConnection.query(
      'SELECT id, story_id, name, content, embed_link FROM chapters WHERE content IS NOT NULL AND updated_at > ?', [oneHourAgo],
      (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      }
    );
  });
    } catch(e) {
      console.log(e)
    }
  }

  async extraName(url: any) {
    console.log(url)
    const regex = /^https:\/\/([^/]+)\/(\d+)_(\d+)\.html$/;
    const match = url.match(regex);
    const [, host, idtruyen, idchuong] = match;
    return {
      host,
      idtruyen,
      idchuong
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    const data:any = await this.getUpdatedJob()
    for (const item of data) {
      await this.teleJobQueue.add("add-to-tele", {
        data: item
      });
    }
  }

  async getStories() {
    try {
      const countData:any = await this.countData("stories");
      const countStep = Math.ceil(countData / 20)
  
      for(let i = 0; i <= countStep; i++) {
          await this.dataStoriesJobQueue.add("data-story-job", {
              data: {
                  limit: 20,
                  offset: i
              }
          })
      }
    } catch(e) {
      console.log(e)
    }
  }

  async getStoriesFile(res: any) {
    const filename = 'stories.txt';
    const filePath = `${cwd()}/src/components/chapter/${filename}`;
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      res.status(404).send('File not found');
    }
  }

  async getChapterFile(res: any) {
    const filename = 'database.txt';
    const filePath = `${cwd()}/src/components/chapter/${filename}`;
    if (fs.existsSync(filePath)) {
      res.download(filePath, "chapters.txt");
    } else {
      res.status(404).send('File not found');
    }
  }
}
