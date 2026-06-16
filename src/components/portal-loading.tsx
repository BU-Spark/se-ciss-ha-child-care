export function PortalLoading({ label = "Loading portal..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
