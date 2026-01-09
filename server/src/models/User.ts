import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';

interface UserAttributes {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  major?: string | null;
  age?: number | null;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailOtpCode?: string;
  emailOtpExpiresAt?: Date;
  otpAttemptsCount?: number;
  otpAttemptsResetAt?: Date;
  isAdmin: boolean;
  watchAllCourses: boolean;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  faculty?: string;
  studyType: string;
  timeShift?: string;
  // Global notification settings
  notifyOnOpen: boolean;
  notifyOnClose: boolean;
  notifyOnSimilarCourse: boolean;
  notifyByEmail: boolean;
  notifyByWeb: boolean;
  notifyByPhone: boolean;
  fcmToken?: string;
  pushTopicSecret?: string;
  lastVerificationEmailSent?: Date;
  verificationEmailsToday?: number;
  verificationEmailCountResetDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isEmailVerified' | 'isAdmin' | 'watchAllCourses' | 'major' | 'age' | 'notifyOnOpen' | 'notifyOnClose' | 'notifyOnSimilarCourse' | 'notifyByEmail' | 'notifyByWeb' | 'notifyByPhone'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public username!: string;
  public passwordHash!: string;
  public major?: string | null;
  public age?: number | null;
  public isEmailVerified!: boolean;
  public emailVerificationToken?: string;
  public emailOtpCode?: string;
  public emailOtpExpiresAt?: Date;
  public otpAttemptsCount?: number;
  public otpAttemptsResetAt?: Date;
  public isAdmin!: boolean;
  public watchAllCourses!: boolean;
  public passwordResetToken?: string;
  public passwordResetTokenExpiry?: Date;
  public faculty?: string;
  public studyType!: string;
  public timeShift?: string;
  // Global notification settings
  public notifyOnOpen!: boolean;
  public notifyOnClose!: boolean;
  public notifyOnSimilarCourse!: boolean;
  public notifyByEmail!: boolean;
  public notifyByWeb!: boolean;
  public notifyByPhone!: boolean;
  public fcmToken?: string;
  public pushTopicSecret?: string;
  public lastVerificationEmailSent?: Date;
  public verificationEmailsToday?: number;
  public verificationEmailCountResetDate?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    major: {
      type: DataTypes.STRING(255),
      allowNull: true, // Now nullable for graduate students
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true, // Now nullable - optional field
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified',
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      field: 'email_verification_token',
    },
    emailOtpCode: {
      type: DataTypes.STRING(6),
      field: 'email_otp_code',
    },
    emailOtpExpiresAt: {
      type: DataTypes.DATE,
      field: 'email_otp_expires_at',
    },
    otpAttemptsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'otp_attempts_count',
    },
    otpAttemptsResetAt: {
      type: DataTypes.DATE,
      field: 'otp_attempts_reset_at',
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_admin',
    },
    watchAllCourses: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'watch_all_courses',
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      field: 'password_reset_token',
    },
    passwordResetTokenExpiry: {
      type: DataTypes.DATE,
      field: 'password_reset_token_expiry',
    },
    faculty: {
      type: DataTypes.STRING(255),
      allowNull: true, // Allow null for postgraduate students
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
    lastVerificationEmailSent: {
      type: DataTypes.DATE,
      field: 'last_verification_email_sent',
    },
    verificationEmailsToday: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'verification_emails_today',
    },
    verificationEmailCountResetDate: {
      type: DataTypes.DATE,
      field: 'verification_email_count_reset_date',
    },
    // Global notification settings
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
    fcmToken: {
      type: DataTypes.STRING(255),
      field: 'fcm_token',
    },
    pushTopicSecret: {
      type: DataTypes.STRING(64),
      field: 'push_topic_secret',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;
