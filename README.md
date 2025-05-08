# AI Persona Chat

AI Persona Chat은 사용자가 다양한 AI 기반 페르소나와 대화할 수 있는 웹 애플리케이션입니다. 사용자 정의 캐릭터와 지속적인 채팅 기록 기능을 제공합니다.

## 주요 기능

*   **다양한 AI 페르소나**: 미리 정의된 페르소나와 즉시 대화 시작
*   **(출시 예정) 커스텀 페르소나**: 나만의 페르소나를 만들고 관리
*   **지속적인 대화 기록**: Supabase에 안전하게 저장
*   **간편한 사용자 인증**: Supabase Auth를 통해 안전하게 로그인

## 기술 스택

*   **Frontend**: Next.js, React, TypeScript, Tailwind CSS
*   **Backend**: Next.js API Routes
*   **Database**: Supabase (PostgreSQL)
*   **AI**: OpenAI API (gpt-3.5-turbo 또는 유사 모델)
*   **Auth**: Supabase Auth

## 시작하기

### 사전 요구 사항

*   [Node.js](https://nodejs.org/) (LTS 버전 권장)
*   [npm](https://www.npmjs.com/) 또는 [yarn](https://yarnpkg.com/)
*   [Git](https://git-scm.com/)

### 설치 방법

1.  **저장소 복제**:
    ```
    git clone https://github.com/[YourGitHubUsername]/ai-persona-chat.git
    cd ai-persona-chat
    ```

2.  **의존성 설치**:
    ```
    npm install
    # 또는
    # yarn install
    ```

3.  **환경 변수 설정**:
    프로젝트 루트의 `.env.example` 파일을 `.env.local`로 복사한 후, 아래 변수들을 실제 값으로 채워주세요. (API 키 등은 각 서비스 대시보드에서 발급받을 수 있습니다.)
    ```
    OPENAI_API_KEY=
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    NEXT_PUBLIC_TEST_USER_EMAIL=
    NEXT_PUBLIC_TEST_USER_PASSWORD=
    ```

4.  **데이터베이스 설정 (Supabase)**:
    *   Supabase 프로젝트를 준비합니다.
    *   Supabase Studio의 SQL Editor에서 `migrations/create_chat_tables.sql` 스크립트를 실행하여 기본 테이블과 RLS 정책을 적용합니다.
    *   (`personas` 테이블 등 추가 스키마/정책이 필요한 경우, `migrations/` 폴더 내 스크립트 또는 관련 문서를 확인해주세요.)

5.  **개발 서버 실행**:
    ```
    npm run dev
    # 또는
    # yarn dev
    ```
    애플리케이션은 `http://localhost:3000`에서 실행됩니다.

## 프로젝트 구조


```
/
├── src/
│   ├── app/                  # Next.js 앱 라우터 (페이지, 레이아웃, API 등)
│   │   ├── (auth)/           # 인증 관련 라우트 그룹
│   │   ├── (main)/           # 메인 애플리케이션 라우트 그룹
│   │   │   └── chat/         # 채팅 관련 페이지
│   │   ├── api/              # API 라우트 핸들러
│   │   └── layout.tsx        # 기본 레이아웃
│   ├── components/           # 재사용 가능한 UI 컴포넌트
│   ├── lib/                  # 헬퍼 함수, Supabase 클라이언트 설정 등
│   ├── types/                # TypeScript 타입 정의
│   └── middleware.ts         # Next.js 미들웨어
├── public/               # 정적 에셋 (이미지, 폰트 등)
├── migrations/           # Supabase 데이터베이스 마이그레이션 파일
├── .env.local            # 로컬 환경 변수 (Git에 포함되지 않음)
├── next.config.js        # Next.js 설정 파일 (또는 .mjs, .ts)
├── tailwind.config.ts    # Tailwind CSS 설정 파일
├── tsconfig.json         # TypeScript 설정 파일
└── package.json          # 프로젝트 의존성 및 스크립트
```


## 라이선스
이 프로젝트는 MIT 라이선스에 따라 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

