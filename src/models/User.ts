import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isAdmin: boolean;
  failedLoginAttempts: number;
  isSoftLocked: boolean;
  isHardLocked: boolean;
  lockedUntil: Date | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  forcePasswordReset: boolean;
  lastLogin: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public isActive!: boolean;
  public isAdmin!: boolean;
  public failedLoginAttempts!: number;
  public isSoftLocked!: boolean;
  public isHardLocked!: boolean;
  public lockedUntil!: Date | null;
  public twoFactorEnabled!: boolean;
  public twoFactorSecret!: string | null;
  public forcePasswordReset!: boolean;
  public lastLogin!: Date | null;
  public lastLoginIp!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public toJSON() {
    const values: any = { ...this.get() };
    delete values.password;
    delete values.twoFactorSecret;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isSoftLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isHardLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    forcePasswordReset: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginIp: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'users',
    indexes: [
      { fields: ['email'] },
      { fields: ['isActive'] },
      { fields: ['isSoftLocked', 'isHardLocked'] }
    ]
  }
);
