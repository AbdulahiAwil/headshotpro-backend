import express from 'express';
import cookieParser from 'cookie-parser';
import config from './config';
import cors from 'cors';
import v1Routers from './routes/v1';
import { errorMiddleware } from './middleware/error.middleware';
import { errorResponse } from './util/response';
import { ingestRoute } from './routes/ingest.route';
import { apiRateLimitConfig } from './middleware/rateLimit';
import helmet from 'helmet';

const app = express();

// 1. Helmet - Secure HTTP Headers (MUST BE FIRST)
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],  // Inline styles for Tailwind/CSS frameworks
        scriptSrc: ["'self'"],                    // Only your domain (Cloudflare proxies transparently)
        imgSrc: ["'self'", "data:", "https:"],    // S3 images + base64
        // connectSrc: [
        //   "'self'",
        //   "https://api.stripe.com",               // Stripe API
        //   "https://replicate.com",                // Replicate AI API
        //   config.env === 'development' 
        //     ? 'http://localhost:3000'             // Local frontend
        //     : config.frontendUrl,                 // Production frontend
        // ],
        fontSrc: ["'self'", "data:"],             // Your fonts (Cloudflare caches them)
        frameSrc: ["'self'"],                     // No external iframes
        objectSrc: ["'none'"],                    // Block plugins
        upgradeInsecureRequests: [],              // Force HTTPS
      },
    },
    crossOriginEmbedderPolicy: false,             // Allow S3 images
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow Cloudflare proxy
  }));



// TODO: Configure cors

app.use(cors({
    origin: config.frontendUrl,
    credentials: true, // Allow cookies to be sent with requests from the specified
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'cookie', 'stripe-signature'],
}))

app.post('/api/v1/payment/webhook/stripe', express.raw({type: 'application/json'}) , async(req, res, next)=> {

    try {
        // TODO : Implement the stripe webhook
        const  { handleStripeWebhook } = await import("./controllers/payment.controller");
        await handleStripeWebhook(req, res);
    } catch (error) {
        next(error);
    } 
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', apiRateLimitConfig.general,(req, res) => {
    res.json({ 
        status: 'OK' ,
        timestamp: new Date().toISOString(),
        message: 'Backend is runing smoothly without any issues',
        frontendUrl: config.frontendUrl,
        env: config.env,
        environment: process.env.NODE_ENV,


    });
});

// TODO: Routes

app.use('/api/v1', v1Routers);
app.use('/api/inngest', ingestRoute)
// TODO: 404 Route

app.use((req, res) => {
    return errorResponse(res, 'Route not found', 404, [{
        path: req.originalUrl,
        message: 'Route not found'
    }]);
});

// TODO: Error Handling Middleware
app.use(errorMiddleware);

export default app;