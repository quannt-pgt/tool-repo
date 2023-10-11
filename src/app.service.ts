import { Injectable } from '@nestjs/common';
import { mariadbConnection } from './mariadb.config';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async fetchDataFromMariaDB(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      mariadbConnection.query('SELECT COUNT(*) AS total FROM chapters', (error:any, results:any) => {
        if (error) {
          reject(error);
        } else {
          const total = results[0].total;
          resolve(total);
        }
      });
    });
  }
}
