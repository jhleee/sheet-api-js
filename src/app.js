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
const { auth } = require('./api/middleware/auth');

const app = express();

// .env에서 설정 가져오기
const SERVER_CONFIG = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 보안 설정
  cors: process.env.ENABLE_CORS !== 'false', // 기본값: true
  helmet: process.env.ENABLE_HELMET !== 'false', // 기본값: true
  jwtAuth: process.env.ENABLE_JWT_AUTH !== 'false', // 기본값: true
  rateLimit: process.env.ENABLE_RATE_LIMIT !== 'false', // 기본값: true
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),

  // Swagger 설정
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false', // 기본값: true
  swaggerCustomCss: process.env.SWAGGER_CUSTOM_CSS || '.swagger-ui .topbar { display: none }',
  swaggerTitle: process.env.SWAGGER_TITLE || 'Google Sheets API Documentation',
  swaggerFavicon: process.env.SWAGGER_FAVICON || '/favicon.ico'
};

// Middleware
if (SERVER_CONFIG.helmet) {
  app.use(helmet());
}

if (SERVER_CONFIG.cors) {
  app.use(cors());
}

app.use(express.json());

// Rate limiting
if (SERVER_CONFIG.rateLimit) {
  const limiter = rateLimit({
    windowMs: SERVER_CONFIG.rateLimitWindow,
    max: SERVER_CONFIG.rateLimitMax
  });
  app.use(limiter);
}

// Swagger configuration
if (SERVER_CONFIG.enableSwagger) {
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
          url: `http://localhost:${SERVER_CONFIG.port}`,
          description: SERVER_CONFIG.nodeEnv === 'production' ? 'Production server' : 'Development server',
        },
      ],
      components: {
        securitySchemes: SERVER_CONFIG.jwtAuth ? {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        } : {},
      },
      security: SERVER_CONFIG.jwtAuth ? [{
        bearerAuth: [],
      }] : [],
    },
    apis: ['./src/api/routes/*.js'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: SERVER_CONFIG.swaggerCustomCss,
    customSiteTitle: SERVER_CONFIG.swaggerTitle,
    customfavIcon: SERVER_CONFIG.swaggerFavicon,
  }));
}

// Routes
if (SERVER_CONFIG.jwtAuth) {
  app.use('/api/auth', authRoutes);
  // JWT 인증이 활성화된 경우 auth 미들웨어 사용
  app.use('/api/sheets', auth, sheetRoutes);
} else {
  // JWT 인증이 비활성화된 경우 인증 없이 직접 라우트 접근
  app.use('/api/sheets', sheetRoutes);
}

// Error handling
app.use(errorHandler);

// 서버 시작 시 로그 출력
const printServerInfo = () => {
  console.log('\n' + chalk.cyan('=========================================='));
  console.log(chalk.green('🚀 서버가 시작되었습니다!'));
  console.log(chalk.cyan('==========================================\n'));

  console.log(chalk.yellow('📝 API 엔드포인트:'));
  console.log(chalk.white(`   - API 서버: ${chalk.blue(`http://localhost:${SERVER_CONFIG.port}`)}`));

  if (SERVER_CONFIG.enableSwagger) {
    console.log(chalk.white(`   - Swagger 문서: ${chalk.blue(`http://localhost:${SERVER_CONFIG.port}/api-docs`)}`));
  }

  console.log(chalk.yellow('\n🔒 보안 설정:'));
  console.log(chalk.white(`   - CORS: ${SERVER_CONFIG.cors ? chalk.green('활성화') : chalk.red('비활성화')}`));
  console.log(chalk.white(`   - Rate Limiting: ${SERVER_CONFIG.rateLimit ? chalk.green('활성화') : chalk.red('비활성화')}`));
  if (SERVER_CONFIG.rateLimit) {
    console.log(chalk.white(`     ├─ 윈도우 시간: ${chalk.blue(SERVER_CONFIG.rateLimitWindow + 'ms')}`));
    console.log(chalk.white(`     └─ 최대 요청 수: ${chalk.blue(SERVER_CONFIG.rateLimitMax + '개')}`));
  }
  console.log(chalk.white(`   - Helmet: ${SERVER_CONFIG.helmet ? chalk.green('활성화') : chalk.red('비활성화')}`));
  console.log(chalk.white(`   - JWT 인증: ${SERVER_CONFIG.jwtAuth ? chalk.green('활성화') : chalk.red('비활성화')}`));

  console.log(chalk.yellow('\n⚙️  환경 설정:'));
  console.log(chalk.white(`   - Node 환경: ${chalk.blue(SERVER_CONFIG.nodeEnv)}`));
  console.log(chalk.white(`   - 포트: ${chalk.blue(SERVER_CONFIG.port)}`));

  console.log(chalk.cyan('\n==========================================\n'));
};

app.listen(SERVER_CONFIG.port, () => {
  printServerInfo();
});

module.exports = app;