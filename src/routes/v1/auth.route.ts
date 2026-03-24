import { authController } from '@/controllers';
import { authenticate } from '@/middleware';
import { authRateLimitConfig } from '@/middleware/rateLimit';
import { validate, validateQuery } from '@/middleware/validate.middleware';
import { loginSchema, registerSchema, resendVerificationSchema, verifyEmailSchema } from '@/validator/auth.validator';
import { Router } from 'express';

const authRoute = Router();

authRoute.post('/register', validate(registerSchema), authController.register)

authRoute.get('/verify-email', validateQuery(verifyEmailSchema),authController.verifyEmail)

authRoute.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerificationEmail)

authRoute.post('/login', authRateLimitConfig.login, validate(loginSchema), authController.login)

authRoute.get('/me', authenticate, authController.getCurrentUser);

authRoute.post('/refresh-token', authController.refreshToken)

authRoute.post('/logout', authenticate, authController.logout)





export default authRoute;