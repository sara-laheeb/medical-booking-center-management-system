/**
 * Express Application Configuration
 * Configures global middlewares (CORS, JSON parser), static asset serving,
 * health checks, Swagger documentation, versioned API routing, and centralized error handling.
 */

'use strict';

const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const cors = require('cors');

const apiRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

/**
 * Security & Middlewares
 * ----------------------
 * - Enable CORS for frontend/mobile clients
 * - Parse JSON body safely
 * - Prevent payload abuse (limit size)
 */
app.use(cors());
app.use(express.json({ limit: '10mb' })); 

/**
 * Static Frontend
 * ----------------
 * Serves built frontend assets (if any)
 */
app.use(express.static(path.join(__dirname, '../frontend')));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System health check and uptime monitoring
 *     tags: [System]
 *     servers:
 *       - url: http://localhost:3000
 *         description: Root Server
 *     responses:
 *       200:
 *         description: Server is online and healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Server is running' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     status: { type: string, example: 'ok' }
 *                     timestamp: { type: string, format: 'date-time' }
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        data: {
            status: 'ok',
            timestamp: new Date().toISOString()
        }
    });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
});

/**
 * API Routes (Versioned)
 * ----------------------
 * All backend logic starts here
 */
app.use('/api/v1', apiRoutes);

/**
 * 404 Handler for API routes only
 * -------------------------------
 * Any /api/* route not matched will land here
 */
app.use('/api', notFoundHandler);

/**
 * SPA Fallback Route
 * ------------------
 * Always serve frontend entry point for browser routes
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/**
 * Global 404 Handler
 * ------------------
 * Catches all unknown routes (non-API + API fallback)
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 * --------------------
 * MUST be last middleware in Express app
 */
app.use(errorHandler);

module.exports = app;