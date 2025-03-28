const express = require('express');
const { auth } = require('../middleware/auth');
const sheetController = require('../controllers/sheetController');

const router = express.Router();

/**
 * @swagger
 * /api/sheets/{spreadsheetId}/metadata:
 *   get:
 *     summary: 구글 시트 메타데이터 조회
 *     tags: [Sheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spreadsheetId
 *         required: true
 *         schema:
 *           type: string
 *         description: "구글 시트 ID"
 *     responses:
 *       200:
 *         description: 성공적으로 메타데이터를 조회했습니다.
 *       401:
 *         description: 인증되지 않은 요청입니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
router.get('/:spreadsheetId/metadata', auth, sheetController.getSheetMetadata);

/**
 * @swagger
 * /api/sheets/{spreadsheetId}/data/{sheetName}:
 *   get:
 *     summary: 구글 시트 데이터 조회
 *     tags: [Sheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spreadsheetId
 *         required: true
 *         schema:
 *           type: string
 *         description: "구글 시트 ID"
 *       - in: path
 *         name: sheetName
 *         required: true
 *         schema:
 *           type: string
 *         description: "시트 이름"
 *       - in: query
 *         name: headerRow
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "헤더 행 인덱스 (0부터 시작, 기본값: 0)"
 *       - in: query
 *         name: skipEmptyRows
 *         schema:
 *           type: boolean
 *           default: true
 *         description: "빈 행 건너뛰기 (기본값: true)"
 *       - in: query
 *         name: skipEmptyCols
 *         schema:
 *           type: boolean
 *           default: true
 *         description: "빈 열 건너뛰기 (기본값: true)"
 *       - in: query
 *         name: trimValues
 *         schema:
 *           type: boolean
 *           default: true
 *         description: "문자열 값의 좌우 공백 제거 (기본값: true)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "반환할 최대 행 수 (0 = 제한 없음, 기본값: 0)"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: "건너뛸 행 수 (기본값: 0)"
 *       - in: query
 *         name: dataOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: "수식 대신 계산된 값만 반환 (기본값: false)"
 *       - in: query
 *         name: filter
 *         schema:
 *           type: object
 *         description: "필터링 조건을 JSON 객체로 지정"
 *         example: '{"name~=홍길동","age>=20"}'
 *       - in: query
 *         name: 필드명
 *         schema:
 *           type: string
 *         description: "필터 조건 (예: age>20, name~=홍, status==완료)"
 *     responses:
 *       200:
 *         description: 성공적으로 데이터를 조회했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *             example: [
 *               {"이름": "홍길동", "나이": "25", "직업": "개발자"},
 *               {"이름": "김철수", "나이": "30", "직업": "디자이너"}
 *             ]
 *       400:
 *         description: 잘못된 요청입니다.
 *       401:
 *         description: 인증되지 않은 요청입니다.
 *       404:
 *         description: 시트를 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */
router.get('/:spreadsheetId/data/:sheetName', auth, sheetController.getSheetData);

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchOperators:
 *       type: object
 *       properties:
 *         "==":
 *           type: string
 *           description: "정확히 일치 (예: name==홍길동)"
 *         "!=":
 *           type: string
 *           description: "일치하지 않음 (예: status!=대기중)"
 *         ">=":
 *           type: string
 *           description: "크거나 같음 (예: age>=25)"
 *         "<=":
 *           type: string
 *           description: "작거나 같음 (예: price<=10000)"
 *         ">":
 *           type: string
 *           description: "큼 (예: score>80)"
 *         "<":
 *           type: string
 *           description: "작음 (예: quantity<10)"
 *         "~=":
 *           type: string
 *           description: "포함 (대소문자 구분 없음) (예: name~=홍)"
 *         "!~":
 *           type: string
 *           description: "미포함 (대소문자 구분 없음) (예: title!~공지)"
 *         "^=":
 *           type: string
 *           description: "시작 (대소문자 구분 없음) (예: name^=김)"
 *         "$=":
 *           type: string
 *           description: "끝남 (대소문자 구분 없음) (예: filename$=.jpg)"
 *         "=~":
 *           type: string
 *           description: "정규식 매칭 (대소문자 구분 없음) (예: email=~^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$)"
 *         "!r":
 *           type: string
 *           description: "정규식 미매칭 (대소문자 구분 없음) (예: phone!r^010)"
 *         "in":
 *           type: string
 *           description: "목록에 포함 (예: job=in=개발자,디자이너,기획자)"
 *         "!n":
 *           type: string
 *           description: "목록에 미포함 (예: status!n=완료,취소)"
 *         "is":
 *           type: string
 *           description: "null 체크 (예: email=is)"
 *         "!s":
 *           type: string
 *           description: "null이 아님 체크 (예: email!s)"
 */

module.exports = router;