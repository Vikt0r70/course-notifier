import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface SystemSettingAttributes {
  id: number;
  key: string;
  value: string;
  updatedAt?: Date;
}

interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id'> {}

class SystemSetting
  extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes
{
  public id!: number;
  public key!: string;
  public value!: string;
  public readonly updatedAt!: Date;
}

SystemSetting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'system_settings',
    timestamps: false,
  }
);

export default SystemSetting;
