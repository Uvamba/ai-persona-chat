"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          console.log("Login successful, redirecting to dashboard...");
          router.push("/"); // Redirect to dashboard after login
        }
      }
    );

    // Check initial session state
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        console.log("Already logged in, redirecting...");
        router.push("/");
      }
    };
    checkSession();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Login / Sign Up</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["github"]} // Example: Add providers like email, google, github etc.
          // Only email/password by default if providers is empty
          redirectTo={`${
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
          }/auth/callback`} // Needed for OAuth providers
          theme="light" // or "dark"
        />
      </div>
    </div>
  );
}
