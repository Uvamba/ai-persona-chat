# AI Persona Chat

## 개요

AI Persona Chat은 사용자가 고유한 성격, 말투, 설정을 가진 LLM 기반 AI 캐릭터와 자연스러운 대화를 나눌 수 있는 웹 챗봇 플랫폼입니다.
기본 제공되는 캐릭터 외에도, 사용자가 자신만의 캐릭터를 생성하고 관리하며, 일관된 설정에 기반으로 맥락에 맞는 대화를 할 수 있습니다.

---

## 핵심 기능 요약

- **GPT-4 Turbo 기반 캐릭터 응답 생성**
  → 각 페르소나는 프롬프트(성격, 말투, 인사말 등)를 기반으로, 일관된 반응을 생성합니다.

- **동적 시스템 프롬프트 구성**
  → 최근 10개 대화와 페르소나 정보를 조합해 system prompt를 자동 생성하여 대화 맥락을 반영합니다.

- **대화 기록 저장 및 불러오기**
  → Supabase의 `conversations`, `messages` 테이블에 사용자별로 저장되며, 이후 이를 기반으로 이어서 대화가 가능합니다.

- **페르소나 선택 및 채팅 UI**
  → 대시보드에서 접근 가능한 페르소나를, 사이드바에서 이전 대화를 선택할 수 있으며, 이는 React 기반 컴포넌트로 구성됩니다.

- **(예정) 사용자 맞춤 페르소나 생성/수정/삭제**
  → 사용자별 CRUD 권한 및 public/private 구분 기능 포함한 페르소나 정보를 생성/수정/삭제 가능

- **(예정) Supabase Auth 기반 로그인/회원가입 및 접근 제어**
  → 이메일/비밀번호 인증과 세션 유지, 사용자별 데이터 필터링(RLS 기반) 포함

---

## 기술 스택 및 환경

| 범주         | 사용 기술                                                                                       | 설명                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Frontend** | **Next.js 14.1.4 (App Router)**, **React 18.2.0**, **Tailwind CSS 3.4.3**, **TypeScript 5.4.2** | 대화 UI, 페르소나 선택 UI, 채팅 인터페이스                                 |
| **Backend**  | **Next.js API Routes**                                                                          | `/api/messages`, `/api/personas` 등 RESTful API 처리 (인증: Supabase Auth) |
| **Database** | **Supabase (PostgreSQL + RLS)**,`supabase-js@2.49.4`                                            | 대화 기록, 사용자 정보, 페르소나 정보 저장 및 접근 제어                    |
| **Auth**     | **Supabase Auth** (`@supabase/auth-ui-react@0.4.7`, `@supabase/ssr@0.6.1`)                      | 이메일/비밀번호 기반 로그인 및 세션 유지                                   |
| **LLM API**  | **OpenAI GPT-4 Turbo**, `openai@4.96.2`                                                         | 캐릭터 응답 생성을 위한 API 호출                                           |

---

## 시스템 구조

<p align="center">
  <img src="https://github.com/user-attachments/assets/e9732b4b-e1ee-40e2-b0dc-7e58c2de5e07"  width="500" height="600"></img><br/>
  </p>

---

## 로컬 개발 환경 및 실행 가이드

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn 최신 버전
- OpenAI API 키
- Supabase 계정

### 1. 프로젝트 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 복사하여 `.env.local`로 만들고, 아래 항목을 채워주세요:

```env
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_TEST_USER_EMAIL=
NEXT_PUBLIC_TEST_USER_PASSWORD=
```

### 3. Supabase 설정

- Supabase 프로젝트를 생성하고, DB 및 키 발급
- `migrations/create_chat_tables.sql` 실행 → `conversations`, `messages` 테이블 생성
- `personas` 테이블은 SQL 실행 또는 Supabase Studio에서 수동 생성
- 각 테이블에 대해 **RLS 정책(Role Level Security)** 설정 필요

### 4. 개발 서버 실행

```bash
npm run dev
```

기본 주소: `http://localhost:3000`

---

## 향후 개발 방향 (v2 계획)

v2에서는 **RAG(Retrieval-Augmented Generation)** 기반의 **장기 기억 기능(Long-Term Memory)** 도입을 목표로 합니다.

- 사용자별 과거 대화 기반 정보 검색 및 참조
- 장기적인 대화 맥락 유지

---

## 라이선스

MIT License
자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.
