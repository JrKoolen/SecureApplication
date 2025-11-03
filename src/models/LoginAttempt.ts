import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LoginAttemptAttributes {
  id: number;
  userId: number | null;
  email: string;
  ipAddress: string;
  country: string | null;
  city: string | null;
  success: boolean;
  failureReason: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface LoginAttemptCreationAttributes extends Optional<LoginAttemptAttributes, 'id' | 'createdAt'> {}

export class LoginAttempt extends Model<LoginAttemptAttributes, LoginAttemptCreationAttributes> implements LoginAttemptAttributes {
  public id!: number;
  public userId!: number | null;
  public email!: string;
  public ipAddress!: string;
  public country!: string | null;
  public city!: string | null;
  public success!: boolean;
  public failureReason!: string | null;
  public userAgent!: string | null;
  public readonly createdAt!: Date;
}

LoginAttempt.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    failureReason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'login_attempts',
    indexes: [
      { fields: ['userId'] },
      { fields: ['email'] },
      { fields: ['ipAddress'] },
      { fields: ['success'] },
      { fields: ['createdAt'] }
    ]
  }
);
