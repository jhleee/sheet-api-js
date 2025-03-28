require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const rateLimit = require('express-rate-limit');
const chalk = require('chalk');

const { errorHandler } = require('./api/middleware/errorHandler');
const sheetRoutes = require('./api/routes/sheetRoutes');
const authRoutes = require('./api/routes/authRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100
});
app.use(limiter);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Google Sheets API',
      version: '1.0.0',
      description: 'Read-only API system based on Google Sheets',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/api/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Google Sheets API Documentation",
  customfavIcon: "/favicon.ico",
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// 서버 시작 시 로그 출력
const printServerInfo = () => {
  console.log('\n' + chalk.cyan('=========================================='));
  console.log(chalk.green('🚀 서버가 시작되었습니다!'));
  console.log(chalk.cyan('==========================================\n'));

  console.log(chalk.yellow('📝 API 엔드포인트:'));
  console.log(chalk.white(`   - API 서버: ${chalk.blue(`http://localhost:${PORT}`)}`));
  console.log(chalk.white(`   - Swagger 문서: ${chalk.blue(`http://localhost:${PORT}/api-docs`)}`));

  console.log(chalk.yellow('\n🔒 보안 설정:'));
  console.log(chalk.white(`   - CORS: ${chalk.green('활성화')}`));
  console.log(chalk.white(`   - Rate Limiting: ${chalk.green('활성화')}`));
  console.log(chalk.white(`   - Helmet: ${chalk.green('활성화')}`));
  console.log(chalk.white(`   - JWT 인증: ${chalk.green('활성화')}`));

  console.log(chalk.yellow('\n⚙️  환경 설정:'));
  console.log(chalk.white(`   - Node 환경: ${chalk.blue(process.env.NODE_ENV || 'development')}`));
  console.log(chalk.white(`   - 포트: ${chalk.blue(PORT)}`));

  console.log(chalk.cyan('\n==========================================\n'));
};

app.listen(PORT, () => {
  printServerInfo();
});

module.exports = app;