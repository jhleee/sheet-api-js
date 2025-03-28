const jwt = require('jsonwebtoken');
const { logger } = require('../../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '인증 토큰이 필요합니다.' },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('인증 오류:', error);
    res.status(401).json({
      success: false,
      error: { message: '유효하지 않은 토큰입니다.' },
    });
  }
};

module.exports = { auth };