# AI Persona Chat

## 소개

AI Persona Chat은 사용자가 다양한 AI 기반 페르소나와 대화할 수 있는 웹 애플리케이션입니다. 사용자 정의 가능한 캐릭터와 지속적인 채팅 기록 기능을 제공하여 매력적인 대화 경험을 선사합니다.

## 주요 기능

- 미리 정의된 AI 페르소나와 채팅
- (출시 예정) 사용자 정의 페르소나 생성 및 관리
- Supabase에 저장되는 지속적인 채팅 기록
- Supabase Auth를 통한 사용자 인증

## 기술 스택

- **프론트엔드:** Next.js, React, TypeScript, Tailwind CSS
- **백엔드:** Next.js API Routes
- **데이터베이스:** Supabase (PostgreSQL)
- **AI:** OpenAI API (gpt-3.5-turbo 또는 유사 모델)
- **인증:** Supabase Auth

## 사전 요구 사항

프로젝트를 로컬에서 실행하기 위해 다음 소프트웨어가 설치되어 있어야 합니다:

- [Node.js](https://nodejs.org/) (LTS 버전 권장)
- [npm](https://www.npmjs.com/) 또는 [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 시작하기 / 설치

프로젝트를 로컬 환경에서 설정하고 실행하는 방법은 다음과 같습니다:

1.  **저장소 복제:**

    ```bash
    git clone https://github.com/[YourGitHubUsername]/ai-persona-chat.git
    cd ai-persona-chat
    ```

2.  **의존성 설치:**
    선호하는 패키지 관리자를 사용하세요.

    ```bash
    npm install
    ```

    또는

    ```bash
    yarn install
    ```

3.  **환경 변수 설정:**
    프로젝트 루트에 제공된 `.env.example` 파일을 `.env.local` 파일로 복사합니다. 그런 다음 아래 목록을 참고하여 실제 값으로 채워주세요. `.env.local` 파일은 보안을 위해 Git 저장소에 포함되지 않습니다.

    ```plaintext
    # OpenAI API 키
    OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Supabase 프로젝트 URL
    NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co

    # Supabase 익명 키 (클라이언트 사이드용)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]

    # Supabase 서비스 역할 키 (서버 사이드용 - 강력한 권한)
    # 이 키는 매우 민감하므로 안전하게 관리해야 합니다.
    # 주로 서버 사이드 작업이나 관리자 권한이 필요한 로컬 개발에 사용됩니다.
    SUPABASE_SERVICE_ROLE_KEY=[your-supabase-service-role-key]

    # 로컬 개발/테스트용 테스트 사용자 이메일 (선택 사항)
    NEXT_PUBLIC_TEST_USER_EMAIL=testuser@example.com

    # 로컬 개발/테스트용 테스트 사용자 비밀번호 (선택 사항)
    NEXT_PUBLIC_TEST_USER_PASSWORD=securepassword123
    ```

    - **`OPENAI_API_KEY`**: [OpenAI 웹사이트](https://platform.openai.com/account/api-keys)에서 API 키를 발급받으세요.
    - **`NEXT_PUBLIC_SUPABASE_URL`** 및 **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase 프로젝트 대시보드의 "Project Settings" > "API" 섹션에서 찾을 수 있습니다.
    - **`SUPABASE_SERVICE_ROLE_KEY`**: Supabase 프로젝트 대시보드의 "Project Settings" > "API" 섹션에서 찾을 수 있습니다. 이 키는 전체 데이터베이스 접근 권한을 가지므로 클라이언트 사이드 코드에 노출되어서는 안 됩니다.

4.  **데이터베이스 설정:**
    이 프로젝트는 Supabase를 데이터베이스로 사용합니다. Supabase 웹사이트에서 새 프로젝트를 생성하거나 기존 프로젝트를 사용하세요.

    a. **Supabase 프로젝트 준비:** - Supabase 대시보드([app.supabase.com](https://app.supabase.com/))에 로그인하여 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다. - 프로젝트의 URL과 `anon` 키, `service_role` 키는 환경 변수 설정 단계에서 필요합니다. (프로젝트 설정 > API 에서 확인)

    b. **테이블 및 스키마 적용:**
    프로젝트에 필요한 테이블 스키마 및 초기 데이터는 `migrations/` 폴더에 SQL 파일로 정의되어 있을 수 있습니다. (또는 `docs/` 폴더 등에 DDL 스크립트가 있을 수 있습니다.)
    이 SQL 스크립트들을 **Supabase Studio의 SQL Editor**를 사용하여 사용자(또는 멘토)의 Supabase 프로젝트에 직접 실행하여 테이블을 생성하고 필요한 데이터를 삽입하세요.
    예를 들어, `personas` 테이블, `conversations` 테이블, `messages` 테이블 등을 생성하는 스크립트를 순서대로 실행해야 할 수 있습니다.

    **참고:** 현재 `migrations/` 폴더에 있는 `create_chat_tables.sql` 스크립트는 `conversations` 및 `messages` 테이블 생성을 다룹니다. `README.md` 예시에서 언급된 `personas` 테이블은 이 스크립트에 포함되어 있지 않으므로, 별도의 SQL 파일을 준비하거나 Supabase Studio를 통해 수동으로 생성해야 합니다. 어떤 `personas` 테이블 스키마를 사용해야 할지는 프로젝트의 다른 문서나 소스 코드를 참조하여 결정해야 할 수 있습니다.

    c. **Row Level Security (RLS) 정책:**
    애플리케이션이 올바르게 작동하려면 적절한 RLS 정책이 필요할 수 있습니다. 이러한 정책이 `migrations/` 폴더의 SQL 스크립트에 포함되어 있지 않다면, Supabase Studio의 "Authentication" > "Policies" 섹션에서 각 테이블에 맞게 직접 설정해야 합니다.

    **참고:** `migrations/create_chat_tables.sql` 스크립트에는 `conversations` 및 `messages` 테이블에 대한 기본적인 RLS (Row Level Security) 정책이 포함되어 있습니다. 이 정책들은 사용자가 자신의 대화와 메시지만 관리할 수 있도록 제한합니다.
    그러나 `personas` 테이블에 대한 RLS 정책은 해당 스크립트에 포함되어 있지 않습니다. 애플리케이션의 페르소나 데이터 접근 제어 요구사항 (예: 모든 사용자가 모든 페르소나를 볼 수 있게 할 것인지, 아니면 특정 사용자만 페르소나를 생성/수정할 수 있게 할 것인지 등)에 따라, Supabase Studio의 "Authentication" > "Policies" 섹션에서 `personas` 테이블에 대한 RLS 정책을 직접 설정해야 할 수 있습니다.

5.  **개발 서버 실행:**
    ```bash
    npm run dev
    ```
    또는
    ```bash
    yarn dev
    ```
    애플리케이션은 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 프로젝트 구조 (선택 사항)

프로젝트의 주요 디렉토리 구조는 다음과 같습니다 (Next.js 앱 디렉토리 기준):

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

## 라이선스 (선택 사항)

이 프로젝트는 MIT 라이선스에 따라 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요. (아직 없다면 MIT 라이선스 내용을 추가할 수 있습니다.)
