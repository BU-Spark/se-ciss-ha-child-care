import { Suspense } from "react";

import SignInContent from "./sign-in-content";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          Loading sign in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
