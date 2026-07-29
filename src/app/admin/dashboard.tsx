"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  deleteParticipant,
  logout,
  saveParticipant,
  setCheckedIn,
} from "./actions";
import type { Participant } from "./types";

type Filter = "all" | "solo" | "2" | "3" | "4";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "all" },
  { value: "solo", label: "solo" },
  { value: "2", label: "team of 2" },
  { value: "3", label: "team of 3" },
  { value: "4", label: "team of 4" },
];

export function Dashboard({ participants }: { participants: Participant[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Participant | null>(null);
  const [showForm, setShowForm] = useState(false);

  const teams = new Set(participants.map((item) => item.team).filter(Boolean)).size;
  const checkedIn = participants.filter((item) => item.checkedIn).length;
  const staying = participants.filter((item) => item.staying).length;

  const visibleParticipants = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return participants.filter((participant) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "solo" && !participant.team) ||
        (filter !== "solo" && participant.teamSize === Number(filter));
      const matchesSearch =
        !needle ||
        [participant.name, participant.email, participant.team, participant.university]
          .some((value) => value?.toLowerCase().includes(needle));
      return matchesFilter && matchesSearch;
    });
  }, [participants, query, filter]);

  function openNewParticipant() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(participant: Participant) {
    setEditing(participant);
    setShowForm(true);
  }

  /* every mutation writes to Supabase, then router.refresh() re-runs the
     server component so the list and the stat cards reflect the new truth */
  function run(work: () => Promise<void>) {
    startTransition(async () => {
      try {
        await work();
        router.refresh();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : "Something went wrong",
        );
      }
    });
  }

  function handleSave(formData: FormData) {
    run(async () => {
      await saveParticipant({
        id: editing?.id ?? null,
        name: String(formData.get("name")),
        email: String(formData.get("email")),
        university: String(formData.get("university")),
        level: String(formData.get("level")),
        team: String(formData.get("team") || "").trim() || null,
        staying: formData.get("staying") === "on",
      });
      setShowForm(false);
    });
  }

  function exportCsv() {
    const header = ["Name", "Email", "University", "Level", "Team", "Overnight", "Checked in"];
    const rows = participants.map((p) => [
      p.name, p.email, p.university, p.level, p.team ?? "Solo",
      p.staying ? "Yes" : "No", p.checkedIn ? "Yes" : "No",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "jammy-jam-registrations.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div className="brand-lockup">
          <Image src="/brand/jammy-jam-logo.png" alt="Jammy Jam" width={598} height={422} priority />
          <span>ADMIN</span>
        </div>
        <form action={logout}>
          <button className="ghost-button" type="submit">Log out ↗</button>
        </form>
      </header>

      <section className="dashboard-heading">
        <div>
          <p className="section-kicker">EVENT CONTROL CENTER</p>
          <h1>Dashboard</h1>
          <p>Manage registrations, teams and arrivals in one place.</p>
        </div>
        <button className="primary-button" onClick={openNewParticipant}>
          <span>＋</span> Add participant
        </button>
      </section>

      <section className="stats-grid" aria-label="Registration summary">
        <StatCard color="blue" icon="◎" label="Total registrations" value={participants.length} detail="Registered participants" />
        <StatCard color="yellow" icon="◇" label="Teams" value={teams} detail={`${participants.filter((p) => p.team).length} team members`} />
        <StatCard color="green" icon="✓" label="Checked in" value={checkedIn} detail={`${participants.length ? Math.round(checkedIn / participants.length * 100) : 0}% attendance`} />
        <StatCard color="violet" icon="☾" label="Overnight stay" value={staying} detail={`${participants.length - staying} not staying`} />
      </section>

      <section className="participant-panel">
        <div className="panel-title">
          <div>
            <p className="section-kicker">PARTICIPANT DIRECTORY</p>
            <h2>Registrations <span>{participants.length}</span></h2>
          </div>
          <button className="csv-button" onClick={exportCsv}>↓ Export CSV</button>
        </div>

        <div className="toolbar">
          <label className="search-box">
            <span>⌕</span>
            <span className="sr-only">Search participants</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, team…"
            />
          </label>
          <div className="filter-tabs" aria-label="Participant type">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                className={filter === item.value ? "active" : ""}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="participant-grid">
          {visibleParticipants.map((participant) => (
            <article className="participant-card" key={participant.id}>
              <div className="participant-main">
                <span className="avatar">{participant.name.charAt(0)}</span>
                <div>
                  <h3>{participant.name}</h3>
                  <p>{participant.email}</p>
                  <small>{participant.university} · {participant.level}</small>
                </div>
              </div>
              <div className="badges">
                <span className={participant.team ? "team-badge" : "solo-badge"}>
                  {participant.team ? `Team: ${participant.team}` : "Solo"}
                </span>
                <span className={participant.staying ? "stay-badge" : "muted-badge"}>
                  {participant.staying ? "☾ Staying" : "Going home"}
                </span>
              </div>
              <div className="card-actions">
                <button
                  className={participant.checkedIn ? "checked-button" : ""}
                  disabled={pending}
                  onClick={() =>
                    run(() => setCheckedIn(participant.id, !participant.checkedIn))
                  }
                >
                  {participant.checkedIn ? "✓ Checked in" : "Check in"}
                </button>
                <button onClick={() => openEdit(participant)}>Edit</button>
                <button
                  className="delete-button"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Delete ${participant.name}?`)) {
                      run(() => deleteParticipant(participant.id));
                    }
                  }}
                  aria-label={`Delete ${participant.name}`}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!visibleParticipants.length && (
            <div className="empty-state">
              <span>?</span>
              <h3>No participant found</h3>
              <p>Try a different search or filter.</p>
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <section
            className="participant-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="participant-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            <p className="section-kicker">REGISTRATION DETAILS</p>
            <h2 id="participant-form-title">{editing ? "Edit participant" : "Add participant"}</h2>
            <form action={handleSave}>
              <label>Full name<input name="name" defaultValue={editing?.name} required /></label>
              <label>Email<input name="email" type="email" defaultValue={editing?.email} required /></label>
              <div className="form-row">
                <label>University<input name="university" defaultValue={editing?.university} required /></label>
                <label>Level<input name="level" defaultValue={editing?.level} placeholder="L3" required /></label>
              </div>
              <label>Team name <small>(leave empty for solo)</small><input name="team" defaultValue={editing?.team ?? ""} /></label>
              <label className="checkbox-label">
                <input name="staying" type="checkbox" defaultChecked={editing?.staying} />
                Staying overnight
              </label>
              <button className="primary-button" type="submit">
                {editing ? "Save changes" : "Add participant"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  color,
  icon,
  label,
  value,
  detail,
}: {
  color: string;
  icon: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className={`stat-card ${color}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
