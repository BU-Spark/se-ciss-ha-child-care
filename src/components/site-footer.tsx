type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-zinc-200 bg-white py-4 px-6 ${className}`.trim()}
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-400">
        <span>
          © {new Date().getFullYear()} Massachusetts Department of Early
          Education and Care
        </span>
        <p className="sm:text-right">
          For support, contact your regional CCR&amp;R agency listed under
          Resources.
        </p>
      </div>
    </footer>
  );
}
