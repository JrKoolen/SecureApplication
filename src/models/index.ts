import { User } from './User';
import { PasswordHistory } from './PasswordHistory';
import { LoginAttempt } from './LoginAttempt';

// Define associations
User.hasMany(PasswordHistory, { foreignKey: 'userId', as: 'passwordHistory' });
PasswordHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LoginAttempt, { foreignKey: 'userId', as: 'loginAttempts' });
LoginAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, PasswordHistory, LoginAttempt };
