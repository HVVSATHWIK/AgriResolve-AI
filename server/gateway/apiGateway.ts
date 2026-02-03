import { Router } from 'express';
import { serviceRegistry } from '../services/serviceRegistry.js';
import { logger } from '../utils/logger.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { 
  validateAnalysisRequest, 
  validateWeatherData,
  sanitizeRequestBody 
} from '../middleware/inputValidator.js';
import { getRateLimitInfo } from '../middleware/rateLimiter.js';

const router = Router();

// Service routing configuration
const serviceRoutes = {
  '/collaboration': 'collaboration-service',
  '/expert': 'expert-service', 
  '/community': 'community-service',
  '/iot': 'iot-service',
  '/treatment': 'treatment-service',
  '/sync': 'sync-service'
};

// Dynamic service proxy setup
Object.entries(serviceRoutes).forEach(([path, serviceName]) => {
  router.use(path, (req, res, next) => {
    const service = serviceRegistry.getService(serviceName);
    
    if (!service || !service.healthy) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: `${serviceName} is currently unavailable`,
        timestamp: new Date().toISOString()
      });
    }

    // Create proxy middleware for the service
    const proxy = createProxyMiddleware({
      target: `http://localhost:${service.port}`,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: ''
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${serviceName}:`, err);
        res.status(502).json({
          error: 'Bad Gateway',
          message: `Error connecting to ${serviceName}`,
          timestamp: new Date().toISOString()
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add service metadata headers
        proxyReq.setHeader('X-Gateway-Service', serviceName);
        proxyReq.setHeader('X-Gateway-Timestamp', new Date().toISOString());
        
        // Forward user context if available
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
      }
    });

    proxy(req, res, next);
  });
});

// Service discovery endpoint
router.get('/services', (req, res) => {
  const services = serviceRegistry.getAllServices();
  res.json({
  services: (Object.entries(services) as Array<[string, { healthy: boolean; port: number; lastHealthCheck: Date }]>).map(([name, service]) => ({
      name,
      status: service.healthy ? 'healthy' : 'unhealthy',
      port: service.port,
      lastHealthCheck: service.lastHealthCheck
    })),
    timestamp: new Date().toISOString()
  });
});

/**
 * Analysis endpoint with input validation
 * Requirements 8.4, 8.5, 8.6: Validate and sanitize all inputs
 */
router.post('/analysis', 
  sanitizeRequestBody,
  validateAnalysisRequest,
  validateWeatherData,
  async (req, res) => {
    try {
      const { cropType, image, weatherData, notes, location } = req.body;
      const rateLimitInfo = getRateLimitInfo(req);

      logger.info('Analysis request received', {
        cropType,
        sessionId: req.session?.id,
        hasWeatherData: !!weatherData,
        quotaRemaining: rateLimitInfo.hourly.remaining
      });

      // Here you would integrate with the actual analysis service
      // For now, return a success response with validation confirmation
      res.json({
        success: true,
        message: 'Analysis request validated successfully',
        data: {
          cropType,
          hasImage: !!image,
          hasWeatherData: !!weatherData,
          hasNotes: !!notes,
          hasLocation: !!location
        },
        rateLimitInfo: {
          quotaRemaining: rateLimitInfo.hourly.remaining,
          quotaUsed: rateLimitInfo.hourly.used,
          resetTime: rateLimitInfo.hourly.resetTime
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Analysis request error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process analysis request',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Load balancing for high-availability services
router.use('/load-balance/:serviceName', (req, res, next) => {
  const { serviceName } = req.params;
  const instances = serviceRegistry.getServiceInstances(serviceName);
  
  if (instances.length === 0) {
    return res.status(503).json({
      error: 'No Available Instances',
      message: `No healthy instances of ${serviceName} available`,
      timestamp: new Date().toISOString()
    });
  }

  // Simple round-robin load balancing
  const instance = serviceRegistry.getNextInstance(serviceName);
  
  const proxy = createProxyMiddleware({
    target: `http://localhost:${instance.port}`,
    changeOrigin: true,
    pathRewrite: {
      [`^/load-balance/${serviceName}`]: ''
    }
  });

  proxy(req, res, next);
});

export { router as apiGateway };