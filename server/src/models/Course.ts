import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface CourseAttributes {
  id: number;
  courseCode: string;
  section: string;
  courseName: string;
  creditHours: string;
  room: string;
  instructor: string;
  days: string;
  time: string;
  teachingMethod: string;
  status: string;
  isOpen: boolean;
  faculty: string;
  studyType: string;
  timeShift?: string;
  period?: string;
  firstOpenedAt?: Date;  // When this course first became open (for "newly opened" filter)
  lastUpdated?: Date;
  createdAt?: Date;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'isOpen'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: number;
  public courseCode!: string;
  public section!: string;
  public courseName!: string;
  public creditHours!: string;
  public room!: string;
  public instructor!: string;
  public days!: string;
  public time!: string;
  public teachingMethod!: string;
  public status!: string;
  public isOpen!: boolean;
  public faculty!: string;
  public studyType!: string;
  public timeShift?: string;
  public period?: string;
  public firstOpenedAt?: Date;
  public lastUpdated!: Date;
  public readonly createdAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    creditHours: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'credit_hours',
    },
    room: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    instructor: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    days: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    teachingMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'teaching_method',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    isOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_open',
    },
    faculty: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    studyType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'study_type',
    },
    timeShift: {
      type: DataTypes.STRING(50),
      field: 'time_shift',
    },
    period: {
      type: DataTypes.STRING(100),
    },
    firstOpenedAt: {
      type: DataTypes.DATE,
      field: 'first_opened_at',
      comment: 'When this course first became open (for newly opened filter)',
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_updated',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'courses',
    timestamps: false,
  }
);

export default Course;
