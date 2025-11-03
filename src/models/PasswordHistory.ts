import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PasswordHistoryAttributes {
  id: number;
  userId: number;
  passwordHash: string;
  createdAt: Date;
}

export interface PasswordHistoryCreationAttributes extends Optional<PasswordHistoryAttributes, 'id' | 'createdAt'> {}

export class PasswordHistory extends Model<PasswordHistoryAttributes, PasswordHistoryCreationAttributes> implements PasswordHistoryAttributes {
  public id!: number;
  public userId!: number;
  public passwordHash!: string;
  public readonly createdAt!: Date;
}

PasswordHistory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'password_history',
    indexes: [
      { fields: ['userId'] },
      { fields: ['createdAt'] }
    ]
  }
);
