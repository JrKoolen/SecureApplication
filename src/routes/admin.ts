import express, { Response, Router } from 'express';
import { Op } from 'sequelize';
import { User, LoginAttempt } from '../models';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// Get all users
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get specific user
router.get('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [
        { 
          model: LoginAttempt, 
          as: 'loginAttempts',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Unlock user account
router.post('/users/:id/unlock', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    user.isHardLocked = false;
    user.isSoftLocked = false;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();
    
    res.json({ message: 'Account unlocked successfully', user: user.toJSON() });
  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({ error: 'Failed to unlock account' });
  }
});

// Force password reset
router.post('/users/:id/force-reset', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    user.forcePasswordReset = true;
    await user.save();
    
    res.json({ message: 'Password reset forced', user: user.toJSON() });
  } catch (error) {
    console.error('Force password reset error:', error);
    res.status(500).json({ error: 'Failed to force password reset' });
  }
});

// Get login attempts
router.get('/login-attempts', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const attempts = await LoginAttempt.findAll({
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });
    
    res.json({ attempts });
  } catch (error) {
    console.error('Get login attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch login attempts' });
  }
});

// Get failed login attempts
router.get('/login-attempts/failed', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const attempts = await LoginAttempt.findAll({
      where: { success: false },
      limit,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ]
    });
    
    res.json({ attempts });
  } catch (error) {
    console.error('Get failed login attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch failed login attempts' });
  }
});

// Get account statistics
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const lockedUsers = await User.count({ where: { isHardLocked: true } });
    const twoFactorUsers = await User.count({ where: { twoFactorEnabled: true } });
    
    const recentFailedAttempts = await LoginAttempt.count({
      where: { 
        success: false,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });
    
    res.json({
      totalUsers,
      activeUsers,
      lockedUsers,
      twoFactorUsers,
      recentFailedAttempts,
      lockPercentage: totalUsers > 0 ? (lockedUsers / totalUsers * 100).toFixed(2) : 0,
      twoFactorPercentage: totalUsers > 0 ? (twoFactorUsers / totalUsers * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
