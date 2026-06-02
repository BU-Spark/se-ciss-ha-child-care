import Link from "next/link";

type SiteHeaderProps = {
  showBack?: boolean;
};

export function SiteHeader({ showBack = false }: SiteHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          EEC Orientation
        </Link>
        {showBack ? (
          <Link
            href="/"
            className="text-sm font-medium text-sky-800 hover:text-sky-900"
          >
            All portals
          </Link>
        ) : null}
      </div>
    </header>
  );
}
