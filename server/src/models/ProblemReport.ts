import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';
import User from './User';

interface ProblemReportAttributes {
  id: number;
  userId: number;
  title: string;
  category: string;
  description: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProblemReportCreationAttributes extends Optional<ProblemReportAttributes, 'id'> {}

class ProblemReport extends Model<ProblemReportAttributes, ProblemReportCreationAttributes> 
  implements ProblemReportAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public category!: string;
  public description!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProblemReport.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['bug', 'feature', 'other']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'resolved']],
      },
    },
  },
  {
    sequelize,
    tableName: 'problem_reports',
    underscored: true,
    timestamps: true,
  }
);

// Associations
ProblemReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default ProblemReport;
