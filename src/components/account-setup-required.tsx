import Link from "next/link";

type AccountSetupRequiredProps = {
  portalLabel: string;
  message?: string;
};

export function AccountSetupRequired({
  portalLabel,
  message,
}: AccountSetupRequiredProps) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <div className="rounded-xl border border-amber-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-[#1a2f5e]">
            Account setup needed
          </h1>
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
            {message ??
              `You are signed in, but this Clerk account is not linked to a ${portalLabel} profile yet.`}
          </p>

          <div className="mt-6 rounded-lg bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700">
            <p className="font-medium text-zinc-900">What to do</p>
            <p className="mt-2">
              Sign out and sign in with the email that matches this portal role,
              then refresh. Provider and CCR&amp;R staff use different emails.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-md bg-[#1a2f5e] px-4 py-2 text-sm font-medium text-white hover:bg-[#152548]"
            >
              Back to home
            </Link>
            <Link
              href="/sign-in"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Switch account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
