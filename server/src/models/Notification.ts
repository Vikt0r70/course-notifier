import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';
import User from './User';
import Watchlist from './Watchlist';

interface NotificationAttributes {
  id: number;
  userId: number;
  watchlistId?: number;
  courseCode: string;
  section: string;
  message: string;
  type: string;
  isRead: boolean;
  sentByEmail: boolean;
  sentByWeb: boolean;
  sentByPhone: boolean;
  createdAt?: Date;
}

interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'isRead' | 'sentByEmail' | 'sentByWeb' | 'sentByPhone'> {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: number;
  public userId!: number;
  public watchlistId?: number;
  public courseCode!: string;
  public section!: string;
  public message!: string;
  public type!: string;
  public isRead!: boolean;
  public sentByEmail!: boolean;
  public sentByWeb!: boolean;
  public sentByPhone!: boolean;
  public readonly createdAt!: Date;
}

Notification.init(
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
    watchlistId: {
      type: DataTypes.INTEGER,
      field: 'watchlist_id',
      references: {
        model: 'watchlists',
        key: 'id',
      },
      onDelete: 'SET NULL',
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read',
    },
    sentByEmail: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sent_by_email',
    },
    sentByWeb: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sent_by_web',
    },
    sentByPhone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'sent_by_phone',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: false,
  }
);

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Notification.belongsTo(Watchlist, { foreignKey: 'watchlistId', as: 'watchlist' });

export default Notification;
