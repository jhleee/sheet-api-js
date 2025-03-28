# Google Sheets API

구글 시트를 데이터 소스로 활용하는 읽기 전용 API 시스템입니다.

## 주요 기능

- 공유된 구글 시트 데이터 읽기 전용 API 제공
- JWT 기반 인증 시스템
- Query Parameter 기반 필터링
- Swagger UI를 통한 API 문서화

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- Docker & Docker Compose
- 공유된 구글 시트 링크

### 환경 설정

1. `.env.example` 파일을 `.env`로 복사하고 필요한 환경 변수를 설정합니다:

```bash
cp .env.example .env
```

2. `.env` 파일에서 다음 변수들을 설정합니다:
   - `JWT_SECRET`: JWT 토큰 생성에 사용할 비밀키

### 설치 및 실행

#### Docker를 사용하는 경우

```bash
docker-compose up --build
```

#### 로컬에서 실행하는 경우

```bash
npm install
npm start
```

## API 사용법

### 1. 토큰 발급

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"expiresIn": "24h"}'
```

### 2. 시트 메타데이터 조회

```bash
curl http://localhost:3000/api/sheets/{spreadsheetId}/metadata \
  -H "Authorization: Bearer {token}"
```

### 3. 시트 데이터 조회

```bash
curl http://localhost:3000/api/sheets/{spreadsheetId}/data/{sheetName} \
  -H "Authorization: Bearer {token}"
```

### 4. 필터링 적용

```bash
curl "http://localhost:3000/api/sheets/{spreadsheetId}/data/{sheetName}?filter={\"column\":\"value\"}" \
  -H "Authorization: Bearer {token}"
```

## 검색 연산자 종류

### 1. 기본 비교 연산자
| 연산자 | 설명 | 예시 |
|--------|------|------|
| `==` | 정확히 일치 | `이름==홍길동` |
| `!=` | 일치하지 않음 | `직업!=학생` |
| `>=` | 크거나 같음 | `나이>=25` |
| `<=` | 작거나 같음 | `가격<=10000` |
| `>` | 큼 | `점수>80` |
| `<` | 작음 | `수량<10` |

### 2. 문자열 검색 연산자
| 연산자 | 설명 | 예시 |
|--------|------|------|
| `~=` | 포함 (대소문자 구분 없음) | `이름~=홍` |
| `!~` | 미포함 (대소문자 구분 없음) | `제목!~공지` |
| `^=` | 시작 (대소문자 구분 없음) | `이름^=김` |
| `$=` | 끝남 (대소문자 구분 없음) | `파일명$=.jpg` |

### 3. 정규식 연산자
| 연산자 | 설명 | 예시 |
|--------|------|------|
| `=~` | 정규식 매칭 (대소문자 구분 없음) | `이메일=~^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` |
| `!~` | 정규식 미매칭 (대소문자 구분 없음) | `전화번호!~^010` |

### 4. 배열 연산자
| 연산자 | 설명 | 예시 |
|--------|------|------|
| `in` | 목록에 포함 | `직업in=개발자,디자이너,기획자` |
| `!n` | 목록에 미포함 | `상태!n=완료,취소` |

### 5. null 체크 연산자
| 연산자 | 설명 | 예시 |
|--------|------|------|
| `is` | null 값 | `이메일is` |
| `!s` | null이 아님 | `이메일!s` |

## 사용 예시

### 단일 조건 필터링
```bash
# 이름에 '홍'이 포함된 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?이름~=홍

# 나이가 25 이상인 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?나이>=25

# 이메일이 null인 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?이메일is
```

### 다중 조건 필터링
```bash
# 나이가 25 이상이고 이름에 '홍'이 포함된 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?나이>=25&이름~=홍

# 직업이 개발자 또는 디자이너이고 이메일이 있는 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?직업in=개발자,디자이너&이메일!s

# 이름이 '김'으로 시작하고 나이가 30 미만인 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?이름^=김&나이<30
```

### 고급 검색 예시
```bash
# 이메일 형식 검증 (정규식 사용)
GET /api/sheets/{spreadsheetId}/data/{sheetName}?이메일=~^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$

# 파일명이 .jpg, .png, .gif로 끝나는 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?파일명in=.jpg,.png,.gif

# 제목에 '공지'가 포함되지 않고 작성일이 '2023-01-01' 이후인 데이터 조회
GET /api/sheets/{spreadsheetId}/data/{sheetName}?제목!~공지&작성일>2023-01-01
```

## 참고사항
- 모든 검색 연산자는 URL 인코딩되어야 합니다.
- 인증이 필요한 API 호출 시 반드시 JWT 토큰을 헤더에 포함해야 합니다.
- API 사용에 대한 더 자세한 정보는 Swagger UI(http://localhost:3000/api-docs)를 참조하세요.

## TODO

- Redis를 통한 데이터 캐싱


## 구글 시트 설정

1. 구글 시트를 생성하고 데이터를 입력합니다.
2. 시트를 공유 설정합니다:
   - "공유" 버튼 클릭
   - "링크가 있는 모든 사용자" 선택
   - "보기자" 권한 부여
3. 공유 링크에서 스프레드시트 ID를 추출합니다:
   - 예: `https://docs.google.com/spreadsheets/d/`**`1234567890abcdefghijklmnopqrstuvwxyz`**`/edit`
   - 위 URL에서 굵은 부분이 스프레드시트 ID입니다.

## API 문서

Swagger UI를 통해 API 문서를 확인할 수 있습니다:
http://localhost:3000/api-docs


## 라이선스

MIT