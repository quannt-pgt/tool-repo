import * as mysql from 'mysql2';
import { config } from 'dotenv';

config()

export const mariadbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export const mariadbConnection = mysql.createConnection(mariadbConfig);
