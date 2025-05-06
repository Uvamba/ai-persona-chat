import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies object.
          // This is needed for Server Components accessing cookies.
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Set the cookie on the response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies object.
          // This is needed for Server Components accessing cookies.
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Set the cookie on the response to remove it
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 현재 사용자 세션 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 사용자가 이미 로그인되어 있거나, 특정 경로(로그인, 인증 콜백)에 있다면
  // 자동 로그인을 시도할 필요가 없으므로 그대로 진행합니다.
  if (user || pathname === "/login" || pathname.startsWith("/auth/callback")) {
    // 만약 로그인한 사용자가 로그인 페이지 접근 시 메인으로 리디렉션 (선택 사항)
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // 세션 갱신 로직 (필요한 경우)
    // await supabase.auth.getSession();
    return response;
  }

  // --- 사용자가 로그인되어 있지 않고, 공개 경로가 아닌 경우 ---
  console.log(
    `Middleware: Unauthenticated access attempt to ${pathname}. Attempting auto-login with test credentials.`
  );

  // 환경 변수에서 테스트 계정 정보 가져오기
  const email = process.env.NEXT_PUBLIC_TEST_USER_EMAIL;
  const password = process.env.NEXT_PUBLIC_TEST_USER_PASSWORD;

  // 환경 변수에 정보가 있는지 확인
  if (email && password) {
    // 자동 로그인 시도
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // 자동 로그인 실패 시
      console.error("Middleware: Automatic login failed:", signInError.message);
      // 수동 로그인을 위해 /login 페이지로 리디렉션 (이미 /login이면 제외)
      if (pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      // 로그인 페이지 자체에서는 실패해도 계속 진행 (오류 메시지 표시 등)
    } else {
      // 자동 로그인 성공 시
      console.log("Middleware: Automatic login successful for:", email);
      // signInWithPassword가 쿠키 핸들러를 통해 세션 쿠키를 설정했을 것입니다.
      // 원래 요청을 그대로 진행시킵니다. 페이지는 이제 인증된 상태로 렌더링됩니다.
      // 'response' 객체에는 Set-Cookie 헤더가 포함되어 있어야 합니다.
      return response;
    }
  } else {
    // 환경 변수에 테스트 계정 정보가 없는 경우
    console.warn(
      "Middleware: Test user credentials not found in env vars. Redirecting to login."
    );
    // 수동 로그인을 위해 /login 페이지로 리디렉션
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 위의 모든 조건에 해당하지 않으면(예: 로그인 페이지 접근 시) 원래 요청 진행
  return response;
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
