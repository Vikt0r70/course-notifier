import { Sequelize } from 'sequelize';
import config from '../config';

const sequelize = new Sequelize(config.database.url, {
  dialect: config.database.dialect,
  logging: config.database.logging ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
