import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';
import User from './User';

interface WatchlistAttributes {
  id: number;
  userId: number;
  courseCode: string;
  section: string;
  courseName: string;
  faculty?: string;
  instructor?: string;
  notifyOnOpen: boolean;
  notifyOnClose: boolean;
  notifyOnSimilarCourse: boolean;
  notifyByEmail: boolean;
  notifyByWeb: boolean;
  notifyByPhone: boolean;
  // Similar course filter settings
  // Each filter is a {days, times} object - user picks days pattern, then available times for that pattern
  // Example: [{"days": "ن ر", "times": ["08:00 AM   إلى   09:30 AM"]}, {"days": "ح ث خ", "times": ["11:00 AM   إلى   12:00 AM"]}]
  // If null/empty, no filtering - all similar courses match
  similarFilters?: Array<{ days: string; times: string[] }>;
  similarFilterNewlyOpened: boolean; // Only notify for courses that opened AFTER watchlist was added
  addedAt?: Date;
}

interface WatchlistCreationAttributes
  extends Optional<
    WatchlistAttributes,
    'id' | 'notifyOnOpen' | 'notifyOnClose' | 'notifyOnSimilarCourse' | 'notifyByEmail' | 'notifyByWeb' | 'notifyByPhone' | 'similarFilters' | 'similarFilterNewlyOpened'
  > {}

class Watchlist extends Model<WatchlistAttributes, WatchlistCreationAttributes> implements WatchlistAttributes {
  public id!: number;
  public userId!: number;
  public courseCode!: string;
  public section!: string;
  public courseName!: string;
  public faculty?: string;
  public instructor?: string;
  public notifyOnOpen!: boolean;
  public notifyOnClose!: boolean;
  public notifyOnSimilarCourse!: boolean;
  public notifyByEmail!: boolean;
  public notifyByWeb!: boolean;
  public notifyByPhone!: boolean;
  // Similar course filter settings
  public similarFilters?: Array<{ days: string; times: string[] }>;
  public similarFilterNewlyOpened!: boolean;
  public readonly addedAt!: Date;
}

Watchlist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    courseCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'course_code',
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    courseName: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'course_name',
    },
    faculty: {
      type: DataTypes.STRING(255),
    },
    instructor: {
      type: DataTypes.STRING(255),
    },
    notifyOnOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'notify_on_open',
    },
    notifyOnClose: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notify_on_close',
    },
    notifyOnSimilarCourse: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'notify_on_similar_course',
    },
    notifyByEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'notify_by_email',
    },
    notifyByWeb: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'notify_by_web',
    },
    notifyByPhone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notify_by_phone',
    },
    // Similar course filter settings
    // JSONB array of {days: string, times: string[]} objects
    // Example: [{"days": "ن ر", "times": ["08:00 AM   إلى   09:30 AM"]}]
    similarFilters: {
      type: DataTypes.JSONB,
      defaultValue: null,
      field: 'similar_filters',
      comment: 'Array of {days, times[]} filter rules for similar courses',
    },
    similarFilterNewlyOpened: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'similar_filter_newly_opened',
      comment: 'Only notify for courses opened after watchlist was added',
    },
    addedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'added_at',
    },
  },
  {
    sequelize,
    tableName: 'watchlists',
    timestamps: false,
  }
);

Watchlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Watchlist;
