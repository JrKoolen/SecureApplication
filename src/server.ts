import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { apiRateLimiter } from './utils/rateLimiter';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import { User } from './models';
import { hashPasswordWithStretching } from './utils/password';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting
app.use('/api/', apiRateLimiter);

// Static files
app.use(express.static('public'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize database and create admin user
const initializeApp = async (): Promise<void> => {
  try {
    await connectDB();
    
    // Create admin user if doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@secureapp.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!Secure';
    
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashedPassword = await hashPasswordWithStretching(adminPassword);
      await User.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        isActive: true,
        failedLoginAttempts: 0,
        isSoftLocked: false,
        isHardLocked: false,
        twoFactorEnabled: false,
        forcePasswordReset: false
      });
      console.log('✅ Admin user created');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}`);
      console.log(`🔐 Admin credentials: ${adminEmail} / ${adminPassword}`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();
