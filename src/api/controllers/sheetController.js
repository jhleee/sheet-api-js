const sheetService = require('../../services/sheetService');
const { logger } = require('../../utils/logger');

class SheetController {
  async getSheetMetadata(req, res) {
    try {
      const { spreadsheetId } = req.params;
      const metadata = await sheetService.getSheetMetadata(spreadsheetId);

      res.json({
        success: true,
        data: metadata,
      });
    } catch (error) {
      logger.error('시트 메타데이터 조회 오류:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  }

  async getSheetData(req, res) {
    try {
      const { spreadsheetId, sheetName } = req.params;
      const {
        headerRow,
        skipEmptyRows,
        skipEmptyCols,
        trimValues,
        limit,
        offset,
        dataOnly,
        ...filterParams
      } = req.query;

      // 옵션 파라미터 자료형 변환
      const options = {};

      // 정수형 변환
      if (headerRow !== undefined) options.headerRow = parseInt(headerRow, 10) || 0;
      if (limit !== undefined) options.limit = parseInt(limit, 10) || 0;
      if (offset !== undefined) options.offset = parseInt(offset, 10) || 0;

      // 불리언 변환
      if (skipEmptyRows !== undefined) options.skipEmptyRows = skipEmptyRows === 'true';
      if (skipEmptyCols !== undefined) options.skipEmptyCols = skipEmptyCols === 'true';
      if (trimValues !== undefined) options.trimValues = trimValues === 'true';
      if (dataOnly !== undefined) options.dataOnly = dataOnly === 'true';

      // 시트 데이터 가져오기
      let data = await sheetService.getSheetData(spreadsheetId, sheetName, options);

      // 필터링 파라미터가 있는 경우에만 필터링 적용
      if (Object.keys(filterParams).length > 0) {
        data = sheetService.filterData(data, filterParams);
      }

      res.json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      logger.error('시트 데이터 조회 오류:', error);

      // 에러 종류에 따른 상태 코드 설정
      let statusCode = 500;
      if (error.message.includes('찾을 수 없') || error.message.includes('시트에 데이터가 없')) {
        statusCode = 404;
      } else if (error.message.includes('잘못된 요청')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        error: { message: error.message },
      });
    }
  }
}

module.exports = new SheetController();