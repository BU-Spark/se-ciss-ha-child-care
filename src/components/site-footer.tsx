type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-zinc-200 bg-white py-4 px-6 ${className}`.trim()}
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-1.5 text-xs text-zinc-400">
        <span>
          © {new Date().getFullYear()} Massachusetts Department of Early
          Education and Care
        </span>
        <p className="leading-relaxed">
          Questions or need help registering? Reach out to your regional CCRR
          agency at{" "}
          <a
            href="https://machildcareresourcesonline.org"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#1a2f5e] underline underline-offset-2"
          >
            machildcareresourcesonline.org
          </a>
          . We&apos;re happy to help!
        </p>
      </div>
    </footer>
  );
}
