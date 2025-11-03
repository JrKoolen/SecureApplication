import express, { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User, LoginAttempt, PasswordHistory } from '../models';
import { hashPasswordWithStretching, verifyPassword, checkPasswordComplexity, calculatePasswordStrength } from '../utils/password';
import { loginRateLimiter } from '../utils/rateLimiter';
import { getLocationFromIp, detectSuspiciousLogin } from '../utils/geolocation';
import { authenticate, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

const SOFT_LOCK_ATTEMPTS = parseInt(process.env.SOFT_LOCK_ATTEMPTS || '3');
const HARD_LOCK_ATTEMPTS = parseInt(process.env.HARD_LOCK_ATTEMPTS || '5');
const LOCK_DURATION_MS = parseInt(process.env.LOCK_DURATION_MS || '1800000'); // 30 minutes

// Helper to record login attempt
const recordLoginAttempt = async (
  userId: number | null,
  email: string,
  ipAddress: string,
  success: boolean,
  failureReason: string | null,
  userAgent: string | null
): Promise<void> => {
  const location = getLocationFromIp(ipAddress);
  
  await LoginAttempt.create({
    userId,
    email,
    ipAddress,
    country: location.country || null,
    city: location.city || null,
    success,
    failureReason,
    userAgent
  });
};

// Helper to handle failed login
const handleFailedLogin = async (user: User, reason: string): Promise<void> => {
  user.failedLoginAttempts += 1;
  
  if (user.failedLoginAttempts >= HARD_LOCK_ATTEMPTS) {
    user.isHardLocked = true;
    user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  } else if (user.failedLoginAttempts >= SOFT_LOCK_ATTEMPTS) {
    user.isSoftLocked = true;
    user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }
  
  await user.save();
};

// Helper to reset failed attempts
const resetFailedAttempts = async (user: User): Promise<void> => {
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.isSoftLocked = false;
    user.lockedUntil = null;
    await user.save();
  }
};

// Register endpoint
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty()
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { email, password, firstName, lastName } = req.body;
      
      // Check password complexity
      const complexity = checkPasswordComplexity(password);
      if (!complexity.isValid) {
        res.status(400).json({ error: 'Password does not meet requirements', details: complexity.errors });
        return;
      }
      
      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }
      
      // Hash password with stretching
      const hashedPassword = await hashPasswordWithStretching(password);
      
      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true,
        isAdmin: false,
        failedLoginAttempts: 0,
        isSoftLocked: false,
        isHardLocked: false,
        twoFactorEnabled: false,
        forcePasswordReset: false
      });
      
      // Save password to history
      await PasswordHistory.create({
        userId: user.id,
        passwordHash: hashedPassword
      });
      
      // Record login attempt
      await recordLoginAttempt(user.id, email, req.ip || 'unknown', true, null, req.headers['user-agent'] || null);
      
      // Reset failed attempts
      await resetFailedAttempts(user);
      
      // Update last login
      user.lastLogin = new Date();
      user.lastLoginIp = req.ip || null;
      await user.save();
      
      res.status(201).json({ 
        message: 'User created successfully',
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login endpoint
router.post('/login', loginRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const { email, password, twoFactorCode } = req.body;
      const ipAddress = req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || null;
      
      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        await recordLoginAttempt(null, email, ipAddress, false, 'User not found', userAgent);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      
      // Check if account is locked
      if (user.isHardLocked) {
        await recordLoginAttempt(user.id, email, ipAddress, false, 'Account hard locked - contact administrator', userAgent);
        res.status(403).json({ error: 'Account is locked. Please contact an administrator.' });
        return;
      }
      
      if (user.isSoftLocked && user.lockedUntil && user.lockedUntil > new Date()) {
        await recordLoginAttempt(user.id, email, ipAddress, false, 'Account soft locked - try again later', userAgent);
        const remainingMs = user.lockedUntil.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        res.status(403).json({ error: `Account locked. Try again in ${remainingMinutes} minutes.` });
        return;
      }
      
      // Reset soft lock if expired
      if (user.isSoftLocked && user.lockedUntil && user.lockedUntil <= new Date()) {
        await resetFailedAttempts(user);
      }
      
      // Check if account is active
      if (!user.isActive) {
        await recordLoginAttempt(user.id, email, ipAddress, false, 'Account inactive', userAgent);
        res.status(403).json({ error: 'Account is inactive' });
        return;
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        await recordLoginAttempt(user.id, email, ipAddress, false, 'Invalid password', userAgent);
        await handleFailedLogin(user, 'Invalid password');
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }
      
      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          await recordLoginAttempt(user.id, email, ipAddress, false, 'Missing 2FA code', userAgent);
          res.status(401).json({ error: '2FA code required', requiresTwoFactor: true });
          return;
        }
        
        const isValidTwoFactor = speakeasy.totp.verify({
          secret: user.twoFactorSecret || '',
          encoding: 'base32',
          token: twoFactorCode,
          window: 2  // Allow 2 time steps (60 seconds) tolerance for clock drift
        });
        
        if (!isValidTwoFactor) {
          console.log('2FA verification failed:', {
            code: twoFactorCode,
            hasSecret: !!user.twoFactorSecret,
            secretLength: user.twoFactorSecret?.length
          });
          await recordLoginAttempt(user.id, email, ipAddress, false, 'Invalid 2FA code', userAgent);
          await handleFailedLogin(user, 'Invalid 2FA code');
          res.status(401).json({ error: 'Invalid 2FA code' });
          return;
        }
      }
      
      // Check for suspicious login
      const location = getLocationFromIp(ipAddress);
      const previousLogin = user.lastLoginIp ? getLocationFromIp(user.lastLoginIp) : null;
      const isSuspicious = detectSuspiciousLogin(location, previousLogin);
      
      // Record successful login
      await recordLoginAttempt(user.id, email, ipAddress, true, null, userAgent);
      await resetFailedAttempts(user);
      
      // Update last login
      user.lastLogin = new Date();
      user.lastLoginIp = ipAddress;
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, isAdmin: user.isAdmin },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: user.toJSON(),
        suspiciousLogin: isSuspicious
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Setup 2FA
router.post('/setup-2fa', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const secret = speakeasy.generateSecret({
      name: `Secure App (${user.email})`
    });
    
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    
    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.otpauth_url
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

// Enable 2FA
router.post('/enable-2fa', authenticate,
  [
    body('twoFactorCode').notEmpty()
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const user = await User.findByPk(req.user!.id);
      if (!user || !user.twoFactorSecret) {
        res.status(400).json({ error: 'Please setup 2FA first' });
        return;
      }
      
      const { twoFactorCode } = req.body;
      
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2  // Allow 2 time steps (60 seconds) tolerance for clock drift
      });
      
      if (!isValid) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }
      
      user.twoFactorEnabled = true;
      await user.save();
      
      res.json({ message: '2FA enabled successfully' });
    } catch (error) {
      console.error('2FA enable error:', error);
      res.status(500).json({ error: 'Failed to enable 2FA' });
    }
  }
);

// Check password strength
router.post('/check-password-strength',
  [
    body('password').notEmpty()
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      
      const strength = calculatePasswordStrength(password);
      const complexity = checkPasswordComplexity(password);
      
      res.json({
        strength,
        complexity,
        feedback: getPasswordFeedback(strength)
      });
    } catch (error) {
      console.error('Password strength check error:', error);
      res.status(500).json({ error: 'Failed to check password strength' });
    }
  }
);

const getPasswordFeedback = (strength: number): string => {
  if (strength < 30) return 'Very Weak';
  if (strength < 50) return 'Weak';
  if (strength < 70) return 'Fair';
  if (strength < 85) return 'Good';
  return 'Very Strong';
};

// Change password
router.post('/change-password', authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const user = await User.findByPk(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }
      
      // Check complexity
      const complexity = checkPasswordComplexity(newPassword);
      if (!complexity.isValid) {
        res.status(400).json({ error: 'New password does not meet requirements', details: complexity.errors });
        return;
      }
      
      // Check password history (prevent reuse)
      const recentPasswords = await PasswordHistory.findAll({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      const newPasswordHash = await hashPasswordWithStretching(newPassword);
      for (const historyItem of recentPasswords) {
        if (historyItem.passwordHash === newPasswordHash) {
          res.status(400).json({ error: 'Cannot reuse recent passwords' });
          return;
        }
      }
      
      // Update password
      user.password = newPasswordHash;
      await user.save();
      
      // Save to history
      await PasswordHistory.create({
        userId: user.id,
        passwordHash: newPasswordHash
      });
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

export default router;
