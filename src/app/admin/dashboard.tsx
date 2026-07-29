"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { logout } from "./actions";

type Participant = {
  id: number;
  name: string;
  email: string;
  university: string;
  level: string;
  team: string | null;
  staying: boolean;
  checkedIn: boolean;
};

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 1, name: "Lina Amrane", email: "lina.amrane@example.com", university: "ESI Algiers", level: "L3", team: "Pixel Forge", staying: true, checkedIn: true },
  { id: 2, name: "Yacine Boudiaf", email: "yacine.b@example.com", university: "USTHB", level: "M1", team: "Pixel Forge", staying: true, checkedIn: false },
  { id: 3, name: "Sara Benali", email: "sara.benali@example.com", university: "Numidia Institute", level: "L2", team: null, staying: false, checkedIn: false },
  { id: 4, name: "Mehdi Khelifi", email: "mehdi.k@example.com", university: "ESI SBA", level: "L3", team: "Blue Rings", staying: true, checkedIn: true },
  { id: 5, name: "Nour El Houda", email: "nour.h@example.com", university: "University of Blida", level: "M2", team: null, staying: false, checkedIn: false },
  { id: 6, name: "Anis Rahmani", email: "anis.r@example.com", university: "ENSIA", level: "L2", team: "Blue Rings", staying: true, checkedIn: false },
];

type Filter = "all" | "teams" | "solo";

export function Dashboard() {
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
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
        (filter === "teams" && participant.team) ||
        (filter === "solo" && !participant.team);
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

  function saveParticipant(formData: FormData) {
    const participant: Participant = {
      id: editing?.id ?? Date.now(),
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      university: String(formData.get("university")),
      level: String(formData.get("level")),
      team: String(formData.get("team") || "").trim() || null,
      staying: formData.get("staying") === "on",
      checkedIn: editing?.checkedIn ?? false,
    };

    setParticipants((current) =>
      editing
        ? current.map((item) => item.id === participant.id ? participant : item)
        : [participant, ...current],
    );
    setShowForm(false);
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
            {(["all", "teams", "solo"] as const).map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
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
                  onClick={() => setParticipants((current) => current.map((item) =>
                    item.id === participant.id ? { ...item, checkedIn: !item.checkedIn } : item
                  ))}
                >
                  {participant.checkedIn ? "✓ Checked in" : "Check in"}
                </button>
                <button onClick={() => openEdit(participant)}>Edit</button>
                <button
                  className="delete-button"
                  onClick={() => {
                    if (window.confirm(`Delete ${participant.name}?`)) {
                      setParticipants((current) => current.filter((item) => item.id !== participant.id));
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
            <form action={saveParticipant}>
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
