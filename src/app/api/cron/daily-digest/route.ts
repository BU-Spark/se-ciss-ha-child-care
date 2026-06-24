import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import type { Prisma } from "@prisma/client";

type DigestRow = Prisma.RegistrationGetPayload<{
  include: { session: { include: { agency: true } } };
}>;
type DigestAgency = DigestRow["session"]["agency"];

const LOOKBACK_MS = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  // Auth: cron caller must send `Authorization: Bearer <CRON_SECRET>`
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_MS);

  // All registrations created in the last 24h, excluding ones already cancelled,
  // with their session + the agency hosting that session.
  const registrations = await prisma.registration.findMany({
    where: {
      createdAt: { gte: since },
      status: { not: "CANCELLED" },
    },
    include: { session: { include: { agency: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Group by the agency that owns the session (cross-region signups land here too).

  const byAgency = new Map<string, { agency: DigestAgency; rows: DigestRow[] }>();

  for (const reg of registrations) {
    const agency = reg.session.agency;
    const group = byAgency.get(agency.id);
    if (group) group.rows.push(reg);
    else byAgency.set(agency.id, { agency, rows: [reg] });
  }

  const results: Array<{ agency: string; sent: boolean; count: number; reason?: string }> = [];

  for (const { agency, rows } of byAgency.values()) {
    if (!agency.email) {
      results.push({ agency: agency.name, sent: false, count: rows.length, reason: "no email on file" });
      continue;
    }

    await sendEmail({
      to: agency.email,
      subject: `Daily orientation signups — ${rows.length} new`,
      html: buildDigestHtml(agency.name, rows),
    });

    results.push({ agency: agency.name, sent: true, count: rows.length });
  }

  return Response.json({
    ok: true,
    window: { since: since.toISOString(), until: new Date().toISOString() },
    totalRegistrations: registrations.length,
    agenciesNotified: results.filter((r) => r.sent).length,
    results,
  });
}

function buildDigestHtml(agencyName: string, rows: DigestRow[]): string {
  const body = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${esc(r.providerName)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${esc(r.organizationName)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${esc(r.session.title)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${fmtDate(r.session.startsAt)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${esc(r.preferredLanguage)}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:640px;">
      <h2 style="color:#1a2f5e;">New orientation signups — ${esc(agencyName)}</h2>
      <p>${rows.length} new registration${rows.length === 1 ? "" : "s"} in the last 24 hours:</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <thead>
          <tr style="text-align:left;background:#f5f5f5;">
            <th style="padding:8px;">Provider</th>
            <th style="padding:8px;">Organization</th>
            <th style="padding:8px;">Session</th>
            <th style="padding:8px;">Date</th>
            <th style="padding:8px;">Language</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(d);
}