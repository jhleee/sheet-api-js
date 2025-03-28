const axios = require('axios');
const { logger } = require('../utils/logger');

class SheetService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    this.axios = axios.create({
      timeout: 10000,
    });
  }

  async getSheetMetadata(spreadsheetId) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${this.apiKey}`;
      const response = await this.axios.get(url);

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          rowCount: sheet.properties.gridProperties.rowCount,
          columnCount: sheet.properties.gridProperties.columnCount,
        })),
      };
    } catch (error) {
      logger.error('구글 시트 메타데이터 조회 오류:', error);
      throw new Error('구글 시트 메타데이터를 가져오는데 실패했습니다.');
    }
  }

  async getSheetData(spreadsheetId, sheetName, options = {}) {
    try {
      // 기본 옵션 설정
      const defaultOptions = {
        headerRow: 0,         // 헤더 행 인덱스 (0부터 시작)
        skipEmptyRows: true,  // 빈 행 건너뛰기
        skipEmptyCols: true,  // 빈 열 건너뛰기
        trimValues: true,     // 값 좌우 공백 제거
        limit: 0,             // 결과 제한 (0 = 제한 없음)
        offset: 0,            // 시작 오프셋 (건너뛸 행 수)
        dataOnly: false       // true면 수식 대신 계산된 값만 반환
      };

      // 사용자 옵션과 기본 옵션 병합
      const mergedOptions = { ...defaultOptions, ...options };


      // 데이터 가져오기 옵션 설정
      let url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${this.apiKey}`;

      // 수식 대신 계산된 값만 반환 옵션
      if (mergedOptions.dataOnly) {
        url += '&valueRenderOption=FORMATTED_VALUE';
      }

      const response = await this.axios.get(url);
      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        throw new Error('시트에 데이터가 없습니다.');
      }

      // 헤더 행 가져오기
      const headers = rows[mergedOptions.headerRow].map(header =>
        mergedOptions.trimValues ? header.trim() : header
      );

      // 유효한 헤더 인덱스 구하기 (빈 열 건너뛰기 옵션 적용)
      const validColumnIndices = mergedOptions.skipEmptyCols
        ? headers.map((header, index) => header ? index : null).filter(index => index !== null)
        : [...Array(headers.length).keys()];

      // 유효한 헤더만 추출
      const validHeaders = validColumnIndices.map(index => headers[index]);

      // 데이터 행 처리 시작
      let data = [];
      for (let i = mergedOptions.headerRow + 1; i < rows.length; i++) {
        // 오프셋 적용
        if (i < mergedOptions.headerRow + 1 + mergedOptions.offset) continue;

        const row = rows[i];

        // 빈 행 건너뛰기 옵션 적용
        if (mergedOptions.skipEmptyRows && (!row || row.every(cell => !cell))) continue;

        // 데이터 객체 생성
        const item = {};
        let isEmpty = true;

        validColumnIndices.forEach((colIndex, index) => {
          const value = row[colIndex];
          const header = validHeaders[index];

          // 값 트리밍 옵션 적용
          const processedValue = value !== undefined && mergedOptions.trimValues && typeof value === 'string'
            ? value.trim()
            : value || null;

          item[header] = processedValue;

          // 행에 데이터가 있는지 확인
          if (processedValue !== null) isEmpty = false;
        });

        // 빈 행이 아니면 데이터에 추가
        if (!isEmpty) data.push(item);

        // 결과 제한 적용
        if (mergedOptions.limit > 0 && data.length >= mergedOptions.limit) break;
      }

      return data;
    } catch (error) {
      logger.error('구글 시트 데이터 조회 오류:', error);
      throw new Error('구글 시트 데이터를 가져오는데 실패했습니다.');
    }
  }


  filterData(data, queryParams) {
    return data.filter(item => {
      return Object.entries(queryParams).every(([key, value]) => {
        // 필드가 존재하지 않는 경우 처리
        if (!(key in item)) return false;

        // 연산자와 비교값 추출
        const operator = value.length >= 2 ? value.substring(0, 2) : '';
        const compareValue = operator ? value.substring(2) : value;
        const fieldValue = item[key];

        // null 또는 undefined 값 처리
        if (fieldValue === null || fieldValue === undefined) {
          if (operator === 'is') return true;
          if (operator === '!s') return false;
          // null이 아닌 값을 기대하는 다른 연산자에 대해 false 반환
          return false;
        }

        switch (operator) {
          case '==':
            return String(fieldValue) === String(compareValue);
          case '!=':
            return String(fieldValue) !== String(compareValue);
          case '>=':
            return String(fieldValue) >= String(compareValue);
          case '<=':
            return String(fieldValue) <= String(compareValue);
          case '>>':
            return String(fieldValue) > String(compareValue);
          case '<<':
            return String(fieldValue) < String(compareValue);
          case '~=':
            return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
          case '!~':
            return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase());
          case '^=':
            return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase());
          case '$=':
            return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase());
          case '=~':
            try {
              return new RegExp(String(compareValue), 'i').test(String(fieldValue));
            } catch (e) {
              // 정규표현식 오류 처리
              return false;
            }
          case '!r': // 정규식 미매칭 (이전에는 !~ 이름 중복 문제가 있었음)
            try {
              return !new RegExp(String(compareValue), 'i').test(String(fieldValue));
            } catch (e) {
              // 정규표현식 오류 처리
              return true;  // 정규식 오류면 매칭되지 않는 것으로 간주
            }
          case 'in':
            return String(compareValue).split(',').map(v => v.trim()).includes(String(fieldValue));
          case '!n':
            return !String(compareValue).split(',').map(v => v.trim()).includes(String(fieldValue));
          case 'is':
            return String(fieldValue) === null;
          case '!s':
            return String(fieldValue) !== null;
          default:
            // 기본 동작: 연산자가 없는 경우 정확한 값 비교
            return String(fieldValue) === String(compareValue);
        }
      });
    });
  }
}

module.exports = new SheetService();