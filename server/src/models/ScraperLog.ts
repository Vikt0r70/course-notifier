import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface ScraperLogAttributes {
  id: number;
  status: string;
  coursesScraped: number;
  coursesAdded: number;
  coursesUpdated: number;
  coursesRemoved: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

interface ScraperLogCreationAttributes extends Optional<ScraperLogAttributes, 'id'> {}

class ScraperLog extends Model<ScraperLogAttributes, ScraperLogCreationAttributes> implements ScraperLogAttributes {
  public id!: number;
  public status!: string;
  public coursesScraped!: number;
  public coursesAdded!: number;
  public coursesUpdated!: number;
  public coursesRemoved!: number;
  public errorMessage?: string;
  public readonly startedAt!: Date;
  public completedAt?: Date;
}

ScraperLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    coursesScraped: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'courses_scraped',
    },
    coursesAdded: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'courses_added',
    },
    coursesUpdated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'courses_updated',
    },
    coursesRemoved: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'courses_removed',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message',
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'scraper_logs',
    timestamps: false,
  }
);

export default ScraperLog;
