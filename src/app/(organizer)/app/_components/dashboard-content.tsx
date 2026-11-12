import Link from "next/link";
import { UiIcon, type UiIconName } from "@/components/ui-icon";
import type { WeddingMemberRole } from "@/modules/wedding/wedding.types";

type DashboardContentProps = {
  organizerName: string;
  showDemoData: boolean;
  events: Array<{
    id: string;
    title: string;
    dayLabel: string;
    timeLabel: string;
    location: string;
    upcoming: boolean;
  }>;
  members: Array<{ id: string; name: string; role: WeddingMemberRole }>;
};

const demoTasks = [
  ["Confirm Sangeet decoration and floral stage setup", "In Progress", "Due today · 4:00 PM", "Sangeet", "Rahul"],
  ["Review photographer quotation and shot list", "Not Started", "Due tomorrow", "Wedding", "Deepesh"],
  ["Confirm caterer menu and final guest estimate", "Not Started", "Due in 3 days", "Reception", "Priya"],
  ["Upload venue map and decorator quotation", "Not Started", "Due December 13", "Sangeet", "Rahul"],
] as const;

const demoResponses = [
  { name: "Sangeet", total: 184, attending: 142, awaiting: 28, declined: 14 },
  { name: "Wedding Ceremony", total: 320, attending: 247, awaiting: 38, declined: 35 },
  { name: "Reception", total: 380, attending: 280, awaiting: 62, declined: 38 },
];

export function DashboardContent({ organizerName, showDemoData, events, members }: DashboardContentProps) {
  const nextEvent = events.find((event) => event.upcoming) ?? null;
  return (
    <>
      <section>
        <h2 className="font-headline-lg text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Welcome back, {organizerName}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Here is what requires your family&apos;s attention today across ceremonies and logistics.</p>
      </section>

      <section aria-label="Quick actions" className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
        <QuickLink href="/app/events/new" icon="plus" label="Create event" primary />
        <FutureAction icon="user-plus" label="Add guest" />
        <FutureAction icon="wallet" label="Record expense" />
        <QuickLink href="/app/organizers" icon="users" label="Manage organizers" />
        <QuickLink href="/app/settings" icon="edit" label="Edit wedding details" />
      </section>

      <NextCeremony event={nextEvent} />

      <section aria-label="Wedding overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="users" label="Guests & RSVP" value={showDemoData ? "320 Guests" : "0 Guests"}>
          <p className="font-semibold text-on-surface">Main wedding ceremony:</p>
          <p>{showDemoData ? "247 attending · 38 awaiting · 35 not attending" : "Guest planning has not started"}</p>
        </StatCard>
        <StatCard icon="calendar" label="Wedding events" value={`${events.length} Active ${events.length === 1 ? "Event" : "Events"}`}>
          <p><strong className="font-semibold text-on-surface">Next: </strong>{nextEvent?.title ?? "No event scheduled"}</p>
          <div className="flex flex-wrap justify-between gap-1"><span>{nextEvent?.timeLabel ?? "Create an event to begin"}</span><span className="font-medium text-primary">{events.length} of 10 events created</span></div>
        </StatCard>
        <StatCard icon="clipboard-check" label="Family tasks" value={showDemoData ? "12 Open Tasks" : "0 Open Tasks"}>
          <p className="font-semibold text-primary">{showDemoData ? "4 assigned to you" : "No tasks assigned"}</p>
          <p>{showDemoData ? "3 due this week" : "Task planning coming soon"}</p>
        </StatCard>
        <StatCard icon="wallet" label="Operational expenses" value={showDemoData ? "₹5,80,000" : "₹0"}>
          <div className="grid grid-cols-2 gap-2"><MiniAmount label="Paid" value={showDemoData ? "₹4,20,000" : "₹0"} /><MiniAmount label="Unpaid" value={showDemoData ? "₹1,60,000" : "₹0"} secondary /></div>
          <p>{showDemoData ? "4 vendor-related expenses recorded" : "No expenses recorded"}</p>
        </StatCard>
      </section>

      <div className="grid grid-cols-1 items-start gap-8 2xl:grid-cols-12">
        <div className="flex flex-col gap-8 2xl:col-span-7"><Priorities showDemoData={showDemoData} /><Timeline events={events} /></div>
        <div className="flex flex-col gap-8 2xl:col-span-5"><GuestSnapshot showDemoData={showDemoData} /><GuestExperience /><ActiveOrganizers members={members} /><RecentActivity showDemoData={showDemoData} /></div>
      </div>
    </>
  );
}

function FutureAction({ icon, label, primary = false }: { icon: UiIconName; label: string; primary?: boolean }) {
  return <button type="button" disabled title={`${label} is coming soon`} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-xs font-semibold shadow-sm sm:text-sm ${primary ? "bg-primary text-on-primary" : "border border-outline-variant bg-white text-on-surface"}`}><UiIcon name={icon} className="h-4 w-4" />{label}<span className="sr-only"> — coming soon</span></button>;
}

function QuickLink({ href, icon, label, primary = false }: { href: string; icon: UiIconName; label: string; primary?: boolean }) {
  return <Link href={href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-xs font-semibold shadow-sm transition-colors sm:text-sm ${primary ? "bg-primary text-on-primary hover:bg-primary-container" : "border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"}`}><UiIcon name={icon} className={`h-4 w-4 ${primary ? "text-on-primary" : "text-primary"}`} />{label}</Link>;
}

function NextCeremony({ event }: { event: DashboardContentProps["events"][number] | null }) {
  return <section className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-4 shadow-sm sm:p-5"><span className="absolute inset-y-0 left-0 w-1.5 bg-primary" /><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div className="flex max-w-3xl flex-col gap-2"><div className="flex flex-wrap items-center gap-2.5"><span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Next ceremony</span><span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant"><UiIcon name="clock" className="h-3.5 w-3.5 text-primary" />{event?.timeLabel ?? "No ceremony scheduled"}</span></div><h3 className="font-headline-lg text-2xl font-semibold tracking-tight text-on-surface">{event?.title ?? "Your first event will appear here"}</h3><p className="flex items-center gap-1 text-xs font-medium text-on-surface-variant sm:text-sm"><UiIcon name="map-pin" className="h-4 w-4 text-primary" />{event?.location ?? "Create an event to begin the ceremony timeline"}</p><div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3"><CeremonyMetric icon="users" value="0 Expected" detail="Guest planning not started" /><CeremonyMetric icon="clipboard-check" value="0 Tasks Due" detail="Task planning not started" /><CeremonyMetric icon="receipt" value="0 Vendors" detail="No vendors linked" /></div></div><Link href={event ? `/app/events/${event.id}` : "/app/events"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-container"><UiIcon name="arrow-right" className="h-4 w-4" />{event ? "View event details" : "View wedding events"}</Link></div></section>;
}

function CeremonyMetric({ icon, value, detail }: { icon: UiIconName; value: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low px-3.5 py-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-primary"><UiIcon name={icon} className="h-4 w-4" /></span><span className="flex min-w-0 flex-col"><strong className="text-sm leading-none text-on-surface">{value}</strong><span className="mt-1 truncate text-[11px] text-on-surface-variant">{detail}</span></span></div>;
}

function StatCard({ icon, label, value, children }: { icon: UiIconName; label: string; value: string; children: React.ReactNode }) {
  return <article className="flex min-h-44 flex-col justify-between rounded-2xl border border-outline-variant bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{label}</p><p className="mt-1 text-2xl font-bold text-on-surface sm:text-[1.7rem]">{value}</p></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-primary"><UiIcon name={icon} /></span></div><div className="mt-3 flex flex-col gap-1 text-xs text-on-surface-variant">{children}</div></article>;
}

function MiniAmount({ label, value, secondary = false }: { label: string; value: string; secondary?: boolean }) {
  return <div className="rounded-lg bg-surface-container-low px-2.5 py-1.5"><span className="block text-[10px] text-on-surface-variant">{label}</span><strong className={secondary ? "text-secondary" : "text-primary"}>{value}</strong></div>;
}

function Priorities({ showDemoData }: { showDemoData: boolean }) {
  const tasks = showDemoData ? demoTasks : [];
  return <Card><CardHeader title="My Priorities" subtitle={`${tasks.length} tasks`} action="View all tasks" /><div className="flex flex-col gap-2.5">{tasks.length ? tasks.map(([title, status, due, event, assignee]) => <div key={title} className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3.5"><span className="mt-0.5 h-5 w-5 shrink-0 rounded border border-outline bg-white" aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1"><strong className="text-xs text-on-surface sm:text-sm">{title}</strong><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status === "In Progress" ? "bg-tertiary-fixed text-on-tertiary-fixed" : "bg-surface-container-high text-on-surface-variant"}`}>{status}</span></div><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant"><span className="font-medium text-primary">{due}</span><span>·</span><span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[11px] text-on-surface">{event}</span><span>·</span><span>Assigned: {assignee}</span></div></div></div>) : <EmptyState text="Tasks will appear here when the family task feature is available." />}</div></Card>;
}

function Timeline({ events }: { events: DashboardContentProps["events"] }) {
  const nextId = events.find((event) => event.upcoming)?.id;
  return <Card><CardHeader title="Upcoming Ceremony Timeline" description="Chronological flow of events across your celebration" subtitle={events.length ? `${events.length} ${events.length === 1 ? "ceremony" : "ceremonies"}` : "No ceremonies"} /><div className="relative flex flex-col gap-6 pl-6 sm:pl-8"><span className="absolute bottom-3 left-2.5 top-2 w-0.5 bg-outline-variant sm:left-3" />{events.length ? events.map((event) => <div key={event.id} className="relative"><span className={`absolute -left-6 mt-1.5 h-3 w-3 rounded-full ring-4 ring-white sm:-left-8 ${event.id === nextId ? "bg-primary" : "bg-secondary"}`} /><div className={event.id === nextId ? "rounded-xl border border-outline-variant/60 bg-surface-container-low p-3" : ""}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-secondary">{event.dayLabel} · {event.timeLabel}</span>{event.id === nextId ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">Next</span> : null}</div><Link href={`/app/events/${event.id}`} className="text-base font-semibold text-on-surface hover:text-primary hover:underline">{event.title}</Link><p className="text-xs text-on-surface-variant">{event.location}</p></div></div>) : <EmptyState text="Your event timeline will appear here." />}</div></Card>;
}

function GuestSnapshot({ showDemoData }: { showDemoData: boolean }) {
  return <Card><CardHeader title="RSVP & Guest Snapshot" description="RSVP and event-by-event responses" subtitle={showDemoData ? "312 total" : "0 total"} /><div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2"><GuestSide label="Groom's side" value={showDemoData ? 168 : 0} primary /><GuestSide label="Bride's side" value={showDemoData ? 144 : 0} /></div><div className="border-b border-outline-variant/50 pb-2 text-xs font-semibold uppercase tracking-wider text-outline">Event responses</div><div className="flex flex-col gap-3.5">{showDemoData ? demoResponses.map((response) => <ResponseBar key={response.name} {...response} />) : <EmptyState text="Guest responses will appear after invitations are sent." />}</div></Card>;
}

function GuestSide({ label, value, primary = false }: { label: string; value: number; primary?: boolean }) {
  return <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-3.5"><p className="text-xs font-semibold uppercase text-outline">{label}</p><p className="mt-1 flex items-baseline gap-1"><strong className={`text-xl ${primary ? "text-primary" : "text-secondary"}`}>{value}</strong><span className="text-xs font-medium text-on-surface-variant">Guests</span></p></div>;
}

function ResponseBar({ name, total, attending, awaiting, declined }: (typeof demoResponses)[number]) {
  return <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3"><div className="flex items-center justify-between gap-2 text-xs"><strong className="text-on-surface">{name}</strong><span className="font-medium text-primary">{total} responses</span></div><div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container-high"><span className="h-full bg-primary" style={{ width: `${(attending / total) * 100}%` }} /><span className="h-full bg-tertiary-fixed-dim" style={{ width: `${(awaiting / total) * 100}%` }} /><span className="h-full bg-secondary-container" style={{ width: `${(declined / total) * 100}%` }} /></div><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]"><span className="text-primary"><strong>{attending}</strong> Attending</span><span className="text-outline">·</span><span className="text-[#8e6c38]"><strong>{awaiting}</strong> Awaiting</span><span className="text-outline">·</span><span className="text-secondary"><strong>{declined}</strong> Not attending</span></div></div>;
}

function GuestExperience() {
  const items: Array<[UiIconName, string]> = [["globe", "Wedding Website"], ["video", "Main Livestream"], ["image", "Media Hub"]];
  return <Card><CardHeader title="Guest Experience Setup" description="Digital touchpoints for celebration attendees" subtitle="3 items" />{items.map(([icon, label]) => <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3 text-xs"><span className="flex items-center gap-2.5 font-medium text-on-surface"><span className="flex h-7 w-7 items-center justify-center rounded-lg border border-outline-variant bg-white text-primary"><UiIcon name={icon} className="h-4 w-4" /></span>{label}</span><span className="text-[11px] font-medium text-outline">Not configured</span></div>)}<FutureAction icon="tune" label="Configure guest experience" /></Card>;
}

function ActiveOrganizers({ members }: { members: DashboardContentProps["members"] }) {
  return <Card><CardHeader title="Active Organizers" description="Family members with access to this wedding workspace" subtitle={`${members.length} active ${members.length === 1 ? "member" : "members"}`} action="Manage" actionHref="/app/organizers" /><div className="flex flex-col gap-2.5">{members.map((member) => <div key={member.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-2.5"><span className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-xs font-semibold text-primary">{initials(member.name)}</span><strong className="truncate text-xs text-on-surface">{member.name}</strong></span><span className="rounded-full border border-outline-variant bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-primary">{member.role.toLowerCase()}</span></div>)}</div></Card>;
}

function RecentActivity({ showDemoData }: { showDemoData: boolean }) {
  const activity = showDemoData ? [["Anita", "added 12 guests to the Sangeet invitation list", "35 minutes ago"], ["Rahul", "recorded a ₹50,000 decoration expense", "2 hours ago"], ["Priya", "changed the Sangeet start time", "Yesterday"], ["Deepesh", "added Royal Caterers as a vendor", "2 days ago"]] : [];
  return <Card><CardHeader title="Recent Activity" description="Family updates and planning logs" />{activity.length ? activity.map(([name, text, time]) => <div key={`${name}-${time}`} className="flex items-start gap-2.5 text-xs"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><span><span className="text-on-surface"><strong>{name}</strong> {text}</span><span className="block text-[11px] text-outline">{time}</span></span></div>) : <EmptyState text="Family activity will appear here as planning features are used." />}</Card>;
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm sm:p-6">{children}</section>;
}

function CardHeader({ title, description, subtitle, action, actionHref }: { title: string; description?: string; subtitle?: string; action?: string; actionHref?: string }) {
  return <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-headline-lg text-xl font-semibold text-on-surface">{title}</h3>{subtitle ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{subtitle}</span> : null}</div>{description ? <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p> : null}</div>{action ? actionHref ? <Link href={actionHref} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{action}<UiIcon name="arrow-right" className="h-3.5 w-3.5" /></Link> : <span className="text-xs font-semibold text-outline">{action} · Soon</span> : null}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-4 text-center text-xs text-on-surface-variant">{text}</p>;
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
