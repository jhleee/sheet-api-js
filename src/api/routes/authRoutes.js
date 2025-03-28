const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /api/auth/token:
 *   post:
 *     summary: JWT 토큰 생성
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresIn:
 *                 type: string
 *                 description: "토큰 만료 기간 (예: 24h, 7d)"
 *     responses:
 *       200:
 *         description: 성공적으로 토큰을 생성했습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
router.post('/token', authController.generateToken);

module.exports = router;