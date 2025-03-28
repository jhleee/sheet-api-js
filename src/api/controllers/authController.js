const jwt = require('jsonwebtoken');
const { logger } = require('../../utils/logger');

class AuthController {
  async generateToken(req, res) {
    try {
      const { expiresIn = process.env.JWT_EXPIRES_IN } = req.body;

      const token = jwt.sign(
        {
          createdAt: new Date().toISOString(),
          expiresIn
        },
        process.env.JWT_SECRET,
        { expiresIn }
      );

      res.json({
        success: true,
        data: {
          token,
          expiresIn,
        },
      });
    } catch (error) {
      logger.error('토큰 생성 오류:', error);
      res.status(500).json({
        success: false,
        error: { message: '토큰 생성에 실패했습니다.' },
      });
    }
  }
}

module.exports = new AuthController();