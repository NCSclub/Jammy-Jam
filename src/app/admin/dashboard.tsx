"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Participant } from "./types";

/**
 * Every mutation is a plain fetch to /api/*. `api` throws with the route's own
 * message, so a 409 shows "That email is already registered" rather than a
 * generic failure, and run() surfaces it in the alert.
 */
async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });

  if (response.status === 401) {
    /* the session expired mid-shift — send them back to the password screen */
    window.location.href = "/admin/login";
    throw new Error("Session expired, sign in again");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong");
  }

  return response;
}

const patchParticipant = (id: string, changes: Record<string, unknown>) =>
  api(`/api/registrations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });

type Filter = "all" | "teams" | "solo" | "2" | "3" | "4";
type ViewMode = "grid" | "list";
type NightFilter = "yes" | "no" | null;
/** "none" is anyone who registered before the question existed. */
type DayFilter = "both" | "13" | "14" | "none" | null;
type TeamGroup = { name: string; members: Participant[] };

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "all" },
  { value: "teams", label: "teams" },
  { value: "solo", label: "solo" },
  { value: "2", label: "team of 2" },
  { value: "3", label: "team of 3" },
  { value: "4", label: "team of 4" },
];

/** The sign-up form caps a squad at 4, so teams below that have room. */
const TEAM_CAP = 4;

const DAY_LABEL: Record<string, string> = {
  both: "both days",
  "13": "13 August only",
  "14": "14 August only",
  none: "no answer",
};

type Patch = { id: string; changes: Partial<Participant> };

export function Dashboard({ participants }: { participants: Participant[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  /* Check-in is the one action HR repeats hundreds of times at the door, so it
     paints immediately instead of waiting for the round trip. React holds the
     patch until the transition settles, then drops it — by which point the
     refreshed server data says the same thing, or the truth wins. */
  const [items, applyPatch] = useOptimistic(
    participants,
    (state: Participant[], patch: Patch) =>
      state.map((participant) =>
        participant.id === patch.id
          ? { ...participant, ...patch.changes }
          : participant,
      ),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Participant | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [nightFilter, setNightFilter] = useState<NightFilter>(null);
  const [dayFilter, setDayFilter] = useState<DayFilter>(null);
  /* one modal serves both head-count panels — it only needs a title and a list */
  const [listModal, setListModal] = useState<{
    title: string;
    people: Participant[];
  } | null>(null);
  const [deleting, setDeleting] = useState<Participant | null>(null);
  const [modifying, setModifying] = useState<TeamGroup | null>(null);
  /* the solo people ticked for a brand-new squad; null means the builder is
     closed. Seeded with whoever opened it. */
  const [newTeam, setNewTeam] = useState<string[] | null>(null);

  /**
   * Leaving the dashboard ends the session — closing the tab, navigating away
   * or refreshing all require the password again.
   *
   * `pagehide` rather than `beforeunload`: it is the only one mobile Safari
   * fires reliably, and it covers the bfcache case. `sendBeacon` rather than
   * fetch, because a normal request is cancelled the instant the page goes
   * away, whereas a beacon is handed to the browser to deliver afterwards.
   *
   * Note this does NOT fire on router.refresh() — that is a client-side data
   * refetch, not a page unload — so check-in, edit and delete are unaffected.
   */
  useEffect(() => {
    function endSession() {
      navigator.sendBeacon?.("/api/admin/logout");
    }
    window.addEventListener("pagehide", endSession);
    return () => window.removeEventListener("pagehide", endSession);
  }, []);

  /* everything below reads the optimistic list, so a check-in moves the stat
     cards and the overnight counts in the same paint as the badge */
  const solos = useMemo(
    () => items.filter((participant) => !participant.team),
    [items],
  );

  const teams = new Set(items.map((item) => item.team).filter(Boolean)).size;
  const checkedIn = items.filter((item) => item.checkedIn).length;

  /* who is sleeping at the venue and who is not — the head-count HR needs for
     mattresses, and the two lists behind it */
  const nightGroups = useMemo(() => {
    const yes: Participant[] = [];
    const no: Participant[] = [];
    for (const participant of items) {
      (participant.staying ? yes : no).push(participant);
    }
    return { yes, no };
  }, [items]);

  /* Which of the two presential days each person is coming for — the head-count
     the venue needs per day. `none` catches anyone who signed up before the
     question existed, or was added by hand without an answer. */
  const dayGroups = useMemo(() => {
    const groups: Record<"both" | "13" | "14" | "none", Participant[]> = {
      both: [],
      "13": [],
      "14": [],
      none: [],
    };
    for (const participant of items) {
      const key = participant.attendance;
      if (key === "both" || key === "13" || key === "14") groups[key].push(participant);
      else groups.none.push(participant);
    }
    return groups;
  }, [items]);

  const visibleParticipants = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((participant) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "teams" && Boolean(participant.team)) ||
        (filter === "solo" && !participant.team) ||
        (filter !== "teams" &&
          filter !== "solo" &&
          participant.teamSize === Number(filter));
      const matchesNight =
        nightFilter === null ||
        (nightFilter === "yes" ? participant.staying : !participant.staying);
      const matchesDay =
        dayFilter === null ||
        (dayFilter === "none"
          ? !participant.attendance
          : participant.attendance === dayFilter);
      const matchesSearch =
        !needle ||
        [
          participant.name,
          participant.email,
          participant.phone,
          participant.team,
          participant.university,
        ].some((value) => value?.toLowerCase().includes(needle));
      return matchesFilter && matchesNight && matchesDay && matchesSearch;
    });
  }, [items, query, filter, nightFilter, dayFilter]);

  /* Every filter that is about squads shows squads: "teams" and each of the
     team-of-N sizes. Only "all" and "solo" list people one by one — for a
     team of 3 you want the squad, not its members scattered across the grid. */
  const teamView = filter !== "all" && filter !== "solo";

  /* one card per team instead of one per person, built from whatever survived
     the search and filters above */
  const teamGroups = useMemo<TeamGroup[]>(() => {
    /* Keyed case-insensitively: registration now stores one canonical spelling
       per squad, but rows created before that — or typed into the Add
       participant form by hand — can still differ, and "powerpuff" showing up
       beside "Powerpuff" as two teams is worse than useless at a check-in
       desk. The first spelling seen is the one displayed. */
    const byKey = new Map<string, TeamGroup>();
    for (const participant of visibleParticipants) {
      if (!participant.team) continue;
      const key = participant.team.trim().toLowerCase();
      const group = byKey.get(key) ?? {
        name: participant.team.trim(),
        members: [],
      };
      group.members.push(participant);
      byKey.set(key, group);
    }
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleParticipants]);

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

  /* Same as run(), but paints the change first. applyPatch has to be called
     inside the transition or React throws — and if the write fails the patch is
     dropped on the way out, so the row snaps back to the server's answer. */
  function runOptimistic(patch: Patch, work: () => Promise<void>) {
    startTransition(async () => {
      applyPatch(patch);
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

  function toggleCheckIn(participant: Participant) {
    const next = !participant.checkedIn;
    runOptimistic({ id: participant.id, changes: { checkedIn: next } }, () =>
      patchParticipant(participant.id, { checkedIn: next }).then(() => undefined),
    );
  }

  function toggleStaying(participant: Participant) {
    const next = !participant.staying;
    runOptimistic({ id: participant.id, changes: { staying: next } }, () =>
      patchParticipant(participant.id, { staying: next }).then(() => undefined),
    );
  }

  function handleSave(formData: FormData) {
    const payload = {
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      phone: String(formData.get("phone") ?? ""),
      discord: String(formData.get("discord") ?? ""),
      university: String(formData.get("university")),
      studentId: String(formData.get("studentId") ?? ""),
      level: String(formData.get("level")),
      skills: String(formData.get("skills") ?? ""),
      expectations: String(formData.get("expectations") ?? ""),
      attendance: String(formData.get("attendance") ?? ""),
      team: String(formData.get("team") || "").trim() || null,
      staying: formData.get("staying") === "on",
    };

    run(async () => {
      if (editing) await patchParticipant(editing.id, payload);
      else
        await api("/api/registrations", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      setShowForm(false);
    });
  }

  function handleCreateTeam(formData: FormData) {
    const memberIds = newTeam ?? [];
    run(async () => {
      await api("/api/teams", {
        method: "POST",
        body: JSON.stringify({
          teamName: String(formData.get("team") ?? ""),
          memberIds,
        }),
      });
      setNewTeam(null);
    });
  }

  /* the route builds the CSV from every column, so the browser only has to
     save the file it is handed */
  function exportCsv() {
    run(async () => {
      const response = await api("/api/registrations/export");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "jammy-jam-registrations.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    /* a hard navigation, not router.replace(): the client router can answer
       from its cached RSC payload, and /admin/login is a server component whose
       whole job is to re-read the cookie. This guarantees it does. */
    window.location.href = "/admin/login";
  }

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <div className="brand-lockup">
          <Image src="/brand/jammy-jam-logo.png" alt="Jammy Jam" width={598} height={422} priority />
          <span>ADMIN</span>
        </div>
        <button className="ghost-button" onClick={handleLogout}>Log out ↗</button>
      </header>

      <section className="dashboard-heading">
        <div>
          <p className="section-kicker">EVENT CONTROL CENTER</p>
          <h1>Dashboard</h1>
          <p>Manage registrations, teams and arrivals in one place.</p>
        </div>
        <div className="heading-actions">
          {/* run() refreshes after its work, so an empty job is just a refetch */}
          <button
            className="ghost-button"
            disabled={pending}
            onClick={() => run(async () => {})}
          >
            {pending ? "⟳ Refreshing…" : "⟳ Refresh"}
          </button>
          <button className="primary-button" onClick={openNewParticipant}>
            <span>＋</span> Add participant
          </button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Registration summary">
        <StatCard color="blue" icon="◎" label="Total registrations" value={items.length} detail="Registered participants" />
        <StatCard color="yellow" icon="◇" label="Teams" value={teams} detail={`${items.length - solos.length} team members`} />
        <StatCard color="green" icon="✓" label="Checked in" value={checkedIn} detail={`${items.length ? Math.round(checkedIn / items.length * 100) : 0}% arrived`} />
        {/* was a duplicate of the overnight panel below — solo count is the
            number that actually needs acting on */}
        <StatCard color="violet" icon="⚑" label="Still solo" value={solos.length} detail="Waiting for a team" />
      </section>

      <section className="night-panel" aria-label="Presential attendance">
        <div className="panel-title">
          <div>
            <p className="section-kicker">WHO COMES WHICH DAY</p>
            <h2>◷ Presential attendance</h2>
          </div>
          {dayFilter ? (
            <button className="csv-button" onClick={() => setDayFilter(null)}>
              ✕ Clear filter — showing {DAY_LABEL[dayFilter]} only
            </button>
          ) : null}
        </div>
        <div className="night-grid">
          <CountColumn
            title="Both days"
            tone="both"
            people={dayGroups.both}
            active={dayFilter === "both"}
            onFilter={() => setDayFilter(dayFilter === "both" ? null : "both")}
            onView={() => setListModal({ title: "Coming both days", people: dayGroups.both })}
          />
          <CountColumn
            title="13 Aug only"
            tone="d13"
            people={dayGroups["13"]}
            active={dayFilter === "13"}
            onFilter={() => setDayFilter(dayFilter === "13" ? null : "13")}
            onView={() => setListModal({ title: "13 August only", people: dayGroups["13"] })}
          />
          <CountColumn
            title="14 Aug only"
            tone="d14"
            people={dayGroups["14"]}
            active={dayFilter === "14"}
            onFilter={() => setDayFilter(dayFilter === "14" ? null : "14")}
            onView={() => setListModal({ title: "14 August only", people: dayGroups["14"] })}
          />
          {/* only worth a column when somebody actually never answered */}
          {dayGroups.none.length ? (
            <CountColumn
              title="Not answered"
              tone="none"
              people={dayGroups.none}
              active={dayFilter === "none"}
              onFilter={() => setDayFilter(dayFilter === "none" ? null : "none")}
              onView={() => setListModal({ title: "No answer given", people: dayGroups.none })}
            />
          ) : null}
        </div>
      </section>

      <section className="night-panel" aria-label="Overnight stay">
        <div className="panel-title">
          <div>
            <p className="section-kicker">SLEEPING ARRANGEMENTS</p>
            <h2>☾ Overnight stay</h2>
          </div>
          {nightFilter ? (
            <button className="csv-button" onClick={() => setNightFilter(null)}>
              ✕ Clear filter — showing{" "}
              {nightFilter === "yes" ? "staying" : "not staying"} only
            </button>
          ) : null}
        </div>
        <div className="night-grid">
          <CountColumn
            title="Staying"
            tone="yes"
            people={nightGroups.yes}
            active={nightFilter === "yes"}
            onFilter={() => setNightFilter(nightFilter === "yes" ? null : "yes")}
            onView={() => setListModal({ title: "Staying overnight", people: nightGroups.yes })}
          />
          <CountColumn
            title="Going home"
            tone="no"
            people={nightGroups.no}
            active={nightFilter === "no"}
            onFilter={() => setNightFilter(nightFilter === "no" ? null : "no")}
            onView={() => setListModal({ title: "Going home", people: nightGroups.no })}
          />
        </div>
      </section>

      <section className="participant-panel">
        <div className="panel-title">
          <div>
            <p className="section-kicker">PARTICIPANT DIRECTORY</p>
            <h2>
              {teamView ? "Teams" : "Registrations"}{" "}
              <span>
                {teamView ? teamGroups.length : visibleParticipants.length}
              </span>
            </h2>
          </div>
          <div className="heading-actions">
            {solos.length > 1 ? (
              <button className="csv-button" onClick={() => setNewTeam([])}>
                ⚑ New team
              </button>
            ) : null}
            <button className="csv-button csv-button--export" onClick={exportCsv}>↓ Export CSV</button>
          </div>
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
          {/* the teams filter draws its own card per team, so the grid/list
              switch has nothing to say there */}
          {!teamView ? (
            <div className="filter-tabs view-tabs" aria-label="Layout">
              <button
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
              >
                ▦ grid
              </button>
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                ☰ list
              </button>
            </div>
          ) : null}
        </div>

        {!visibleParticipants.length ? (
          <div className="participant-grid">
            <div className="empty-state">
              <span>?</span>
              <h3>{teamView ? "No team found" : "No participant found"}</h3>
              <p>Try a different search or filter.</p>
            </div>
          </div>
        ) : teamView ? (
          <div className="team-grid">
            {teamGroups.map((group) => (
              <TeamCard
                key={group.name}
                group={group}
                pending={pending}
                onModify={() => setModifying(group)}
                onToggleCheckIn={toggleCheckIn}
                onEdit={openEdit}
                onDelete={setDeleting}
                onLeave={(member) => run(async () => { await patchParticipant(member.id, { team: null }); })}
              />
            ))}
          </div>
        ) : view === "list" ? (
          <ListTable
            rows={visibleParticipants}
            pending={pending}
            onToggleCheckIn={toggleCheckIn}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        ) : (
          <div className="participant-grid">
            {visibleParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                pending={pending}
                onToggleCheckIn={() => toggleCheckIn(participant)}
                onToggleStaying={() => toggleStaying(participant)}
                onEdit={() => openEdit(participant)}
                onDelete={() => setDeleting(participant)}
              />
            ))}
          </div>
        )}
      </section>

      {deleting && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDeleting(null)}>
          <section
            className="participant-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setDeleting(null)} aria-label="Close">×</button>
            <p className="section-kicker">DANGER ZONE</p>
            <h2 id="delete-title">Delete registration?</h2>
            <p className="modal-note">
              This permanently removes <strong>{deleting.name}</strong>
              {deleting.team ? ` from team ${deleting.team}` : ""}. It cannot be
              undone.
            </p>
            <div className="modal-buttons">
              <button className="ghost-button" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={pending}
                onClick={() => {
                  const id = deleting.id;
                  setDeleting(null);
                  run(async () => { await api(`/api/registrations/${id}`, { method: "DELETE" }); });
                }}
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      )}

      {/* one modal for both panels — attendance and overnight only differ by
          the title and the list they hand it */}
      {listModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setListModal(null)}>
          <section
            className="participant-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="people-list-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setListModal(null)} aria-label="Close">×</button>
            <p className="section-kicker">HEAD COUNT</p>
            <h2 id="people-list-title">
              {listModal.title}{" "}
              <span className="count-pill">{listModal.people.length}</span>
            </h2>
            <ul className="night-list">
              {listModal.people.map((person) => (
                <li key={person.id}>
                  <span>
                    {person.name}
                    <small>{person.email}</small>
                  </span>
                  <em>{person.team ?? "Solo"}</em>
                </li>
              ))}
              {!listModal.people.length && (
                <li className="night-list__empty">No one yet.</li>
              )}
            </ul>
          </section>
        </div>
      )}

      {modifying && (
        <ModifyTeamModal
          group={modifying}
          solos={solos}
          pending={pending}
          onClose={() => setModifying(null)}
          onRename={(name) =>
            run(async () => {
              await api("/api/teams", {
                method: "PATCH",
                body: JSON.stringify({ from: modifying.name, to: name }),
              });
              setModifying(null);
            })
          }
          onAdd={(memberIds) =>
            run(async () => {
              await api("/api/teams", {
                method: "POST",
                body: JSON.stringify({ teamName: modifying.name, memberIds }),
              });
              setModifying(null);
            })
          }
          onRemove={(id) =>
            run(async () => {
              await patchParticipant(id, { team: null });
              setModifying(null);
            })
          }
        />
      )}

      {newTeam && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setNewTeam(null)}>
          <section
            className="participant-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-team-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setNewTeam(null)} aria-label="Close">×</button>
            <p className="section-kicker">SQUAD BUILDER</p>
            <h2 id="new-team-title">New team</h2>
            <form action={handleCreateTeam}>
              <label>
                Team name
                <input name="team" placeholder="Chaos Emeralds" required autoFocus />
              </label>

              <fieldset className="team-picker">
                <legend>
                  Members <small>{newTeam.length}/{TEAM_CAP} picked</small>
                </legend>
                {solos.map((solo) => {
                  const picked = newTeam.includes(solo.id);
                  return (
                    <label key={solo.id} className="team-picker__row">
                      <input
                        type="checkbox"
                        checked={picked}
                        /* stop at four, but never block un-ticking */
                        disabled={!picked && newTeam.length >= TEAM_CAP}
                        onChange={() =>
                          setNewTeam((current) =>
                            (current ?? []).includes(solo.id)
                              ? (current ?? []).filter((id) => id !== solo.id)
                              : [...(current ?? []), solo.id],
                          )
                        }
                      />
                      <span>
                        {solo.name}
                        <small>{solo.university} · {solo.level}</small>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <button
                className="primary-button"
                type="submit"
                disabled={pending || newTeam.length < 2}
              >
                {newTeam.length < 2
                  ? "Pick at least 2 people"
                  : `Create team of ${newTeam.length}`}
              </button>
            </form>
          </section>
        </div>
      )}

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
              {/* same fields, same order as the public sign-up form, so what
                  HR edits here is what the participant filled in */}
              <label>Full name<input name="name" defaultValue={editing?.name} required /></label>
              <div className="form-row">
                <label>Email<input name="email" type="email" defaultValue={editing?.email} required /></label>
                <label>Phone<input name="phone" type="tel" defaultValue={editing?.phone ?? ""} /></label>
              </div>
              <div className="form-row">
                <label>Discord tag<input name="discord" defaultValue={editing?.discord ?? ""} /></label>
                <label>Student ID<input name="studentId" defaultValue={editing?.studentId ?? ""} /></label>
              </div>
              <div className="form-row">
                <label>University<input name="university" defaultValue={editing?.university} required /></label>
                <label>Level<input name="level" defaultValue={editing?.level} placeholder="L3" required /></label>
              </div>
              <label>
                Skills
                <input
                  name="skills"
                  defaultValue={editing?.skills ?? ""}
                  placeholder="E.g. Web dev, pixel art, sound design…"
                />
              </label>
              <label>
                Expectations
                <textarea
                  name="expectations"
                  rows={3}
                  defaultValue={editing?.expectations ?? ""}
                  placeholder="What they hope to get out of the jam"
                />
              </label>
              <label>
                Days attending
                <select name="attendance" defaultValue={editing?.attendance ?? ""}>
                  <option value="">Not answered</option>
                  <option value="both">Both days</option>
                  <option value="13">13 August only</option>
                  <option value="14">14 August only</option>
                </select>
              </label>
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

/* --------------------------------------------------------------------------
   A head-count that doubles as a filter. Shared by the attendance and the
   overnight panels — `tone` just picks the colour of the count pill.
   -------------------------------------------------------------------------- */
function CountColumn({
  title,
  tone,
  people,
  active,
  onFilter,
  onView,
}: {
  title: string;
  tone: "yes" | "no" | "both" | "d13" | "d14" | "none";
  people: Participant[];
  active: boolean;
  onFilter: () => void;
  onView: () => void;
}) {
  return (
    <div className={`night-column ${tone} ${active ? "active" : ""}`}>
      <button
        className="night-column__head"
        onClick={onFilter}
        aria-pressed={active}
        title="Filter the list below"
      >
        <span>{title}</span>
        <strong>{people.length}</strong>
      </button>
      <button
        className="night-column__view"
        onClick={onView}
        disabled={!people.length}
      >
        View list
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
   One participant, as a card
   -------------------------------------------------------------------------- */
function ParticipantCard({
  participant,
  pending,
  onToggleCheckIn,
  onToggleStaying,
  onEdit,
  onDelete,
}: {
  participant: Participant;
  pending: boolean;
  onToggleCheckIn: () => void;
  onToggleStaying: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="participant-card">
      <div className="participant-main">
        <span className="avatar">{participant.name.charAt(0)}</span>
        <div>
          <h3>{participant.name}</h3>
          <p>{participant.email}</p>
          <small>
            {participant.university} · {participant.level}
            {participant.phone ? ` · ${participant.phone}` : ""}
          </small>
        </div>
      </div>
      <div className="badges">
        <span className={participant.team ? "team-badge" : "solo-badge"}>
          {participant.team ? `Team: ${participant.team}` : "Solo"}
        </span>
        {/* a button, not a label: HR flips these at the door all night. Never
            disabled — the point of the optimistic patch is that it stays live */}
        <button
          className={`badge-toggle ${participant.staying ? "stay-badge" : "muted-badge"}`}
          onClick={onToggleStaying}
          title="Click to flip the overnight answer"
        >
          {participant.staying ? "☾ Staying" : "Going home"}
        </button>
        {/* only worth flagging when they are NOT there for both days */}
        {participant.attendance && participant.attendance !== "both" ? (
          <span className="partial-badge">{participant.attendance} Aug only</span>
        ) : null}
      </div>
      {participant.teamMembers.length ? (
        <p className="team-roster">With: {participant.teamMembers.join(", ")}</p>
      ) : null}

      {/* Squad membership is managed where it makes sense: the teams filter.
          Modify on a team card adds or removes people, ⚑ New team builds one. */}
      <div className="card-actions">
        <button
          className={participant.checkedIn ? "checked-button" : ""}
          onClick={onToggleCheckIn}
        >
          {participant.checkedIn ? "✓ Checked in" : "Check in"}
        </button>
        <button onClick={onEdit}>Edit</button>
        <button
          className="delete-button"
          disabled={pending}
          onClick={onDelete}
          aria-label={`Delete ${participant.name}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------------------
   One team, with every registered member folded inside it
   -------------------------------------------------------------------------- */
function TeamCard({
  group,
  pending,
  onModify,
  onToggleCheckIn,
  onEdit,
  onDelete,
  onLeave,
}: {
  group: TeamGroup;
  pending: boolean;
  onModify: () => void;
  onToggleCheckIn: (member: Participant) => void;
  onEdit: (member: Participant) => void;
  onDelete: (member: Participant) => void;
  onLeave: (member: Participant) => void;
}) {
  const registered = group.members.length;
  const present = group.members.filter((member) => member.checkedIn).length;
  const staying = group.members.filter((member) => member.staying).length;

  /* Names the members typed on the form, minus anyone who has since registered
     — so what is left is who the squad is still waiting on. A person drops off
     this list the moment their own sign-up lands. */
  const registeredNames = new Set(
    group.members.map((member) => member.name.trim().toLowerCase()),
  );
  const missing = [
    ...new Set(
      group.members
        .flatMap((member) => member.teamMembers)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ].filter((name) => !registeredNames.has(name.toLowerCase()));

  /* How big the squad actually is: what they declared on the form, but never
     less than the people who have registered plus the ones still named. */
  const declared = Math.max(
    registered + missing.length,
    ...group.members.map((member) => member.teamSize ?? 0),
  );
  const complete = registered >= declared;

  return (
    <article className="team-card">
      <header className="team-card__head">
        <div>
          <p className="section-kicker">TEAM</p>
          <h3>{group.name}</h3>
          <div className="badges">
            <span className={complete ? "stay-badge" : "partial-badge"}>
              ◇ {registered}/{declared} registered
            </span>
            <span className={present === registered ? "stay-badge" : ""}>
              ✓ {present}/{registered} checked in
            </span>
            {staying ? <span className="stay-badge">☾ {staying} staying</span> : null}
          </div>
        </div>
        <button className="csv-button" onClick={onModify}>✎ Modify</button>
      </header>

      <div className="team-card__members">
        {group.members.map((member) => (
          <div className="team-card__member" key={member.id}>
            <span className="avatar">{member.name.charAt(0)}</span>
            <div className="team-card__member-body">
              <h4>{member.name}</h4>
              <p>{member.email}</p>
              <small>
                {member.university} · {member.level}
                {member.phone ? ` · ${member.phone}` : ""}
              </small>
              {member.attendance && member.attendance !== "both" ? (
                <span className="partial-badge">{member.attendance} Aug only</span>
              ) : null}
              <div className="card-actions">
                <button
                  className={member.checkedIn ? "checked-button" : ""}
                  disabled={pending}
                  onClick={() => onToggleCheckIn(member)}
                >
                  {member.checkedIn ? "✓ Checked in" : "Check in"}
                </button>
                <button onClick={() => onEdit(member)}>Edit</button>
                <button disabled={pending} onClick={() => onLeave(member)}>
                  ↩ Leave
                </button>
                <button
                  className="delete-button"
                  disabled={pending}
                  onClick={() => onDelete(member)}
                  aria-label={`Delete ${member.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {missing.length ? (
        <div className="team-card__missing">
          <p className="team-card__missing-title">
            ⚠ Still to register <span>{missing.length}</span>
          </p>
          <ul>
            {missing.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

/* --------------------------------------------------------------------------
   The table view — the same rows, dense, for scanning at the door
   -------------------------------------------------------------------------- */
function ListTable({
  rows,
  pending,
  onToggleCheckIn,
  onEdit,
  onDelete,
}: {
  rows: Participant[];
  pending: boolean;
  onToggleCheckIn: (participant: Participant) => void;
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
}) {
  return (
    <div className="list-wrap">
      <table className="list-table">
        <thead>
          <tr>
            <th>Participant</th>
            <th>Contact</th>
            <th>Team</th>
            <th>Night</th>
            <th>Check-in</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((participant) => (
            <tr key={participant.id}>
              <td>
                <div className="list-table__who">
                  <span className="avatar">{participant.name.charAt(0)}</span>
                  <div>
                    <strong>{participant.name}</strong>
                    <small>
                      {participant.university} · {participant.level}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                <span className="list-table__email">{participant.email}</span>
                <small>{participant.phone ?? "—"}</small>
              </td>
              <td>{participant.team ?? "Solo"}</td>
              <td>{participant.staying ? "☾ Staying" : "—"}</td>
              <td>
                <button
                  className={participant.checkedIn ? "checked-button" : ""}
                  disabled={pending}
                  onClick={() => onToggleCheckIn(participant)}
                >
                  {participant.checkedIn ? "✓ In" : "Check in"}
                </button>
              </td>
              <td>
                <div className="card-actions">
                  <button onClick={() => onEdit(participant)}>Edit</button>
                  <button
                    className="delete-button"
                    disabled={pending}
                    onClick={() => onDelete(participant)}
                    aria-label={`Delete ${participant.name}`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Modify team — rename it, drop people, or pull solo people in
   -------------------------------------------------------------------------- */
function ModifyTeamModal({
  group,
  solos,
  pending,
  onClose,
  onRename,
  onAdd,
  onRemove,
}: {
  group: TeamGroup;
  solos: Participant[];
  pending: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onAdd: (memberIds: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState(group.name);
  const [picked, setPicked] = useState<string[]>([]);

  /* never read below what a member declared: someone who signed up as a team
     of 4 has 3 teammates who simply have not registered yet */
  const declared = Math.max(
    group.members.length,
    ...group.members.map((member) => member.teamSize ?? 0),
  );
  const spare = Math.max(0, TEAM_CAP - declared);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="participant-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modify-team-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <p className="section-kicker">SQUAD CONTROL</p>
        <h2 id="modify-team-title">Modify team</h2>

        <label className="stacked-label">
          Team name
          <div className="inline-field">
            <input value={name} onChange={(event) => setName(event.target.value)} />
            <button
              className="primary-button"
              disabled={pending || !name.trim() || name.trim() === group.name}
              onClick={() => onRename(name)}
            >
              Rename
            </button>
          </div>
        </label>

        <fieldset className="team-picker">
          <legend>
            Registered <small>{group.members.length}/{TEAM_CAP}</small>
          </legend>
          {group.members.map((member) => (
            <div className="team-picker__row" key={member.id}>
              <span>
                {member.name}
                <small>{member.email}</small>
              </span>
              <button
                className="delete-button"
                disabled={pending}
                onClick={() => onRemove(member.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </fieldset>

        <fieldset className="team-picker">
          <legend>
            Add solo people <small>{spare} spot{spare === 1 ? "" : "s"} left</small>
          </legend>
          {!spare ? (
            <p className="modal-note">This team is already full.</p>
          ) : !solos.length ? (
            <p className="modal-note">Nobody is registered solo right now.</p>
          ) : (
            solos.map((solo) => {
              const chosen = picked.includes(solo.id);
              return (
                <label className="team-picker__row" key={solo.id}>
                  <input
                    type="checkbox"
                    checked={chosen}
                    disabled={!chosen && picked.length >= spare}
                    onChange={() =>
                      setPicked((current) =>
                        current.includes(solo.id)
                          ? current.filter((id) => id !== solo.id)
                          : [...current, solo.id],
                      )
                    }
                  />
                  <span>
                    {solo.name}
                    <small>{solo.university} · {solo.level}</small>
                  </span>
                </label>
              );
            })
          )}
        </fieldset>

        <button
          className="primary-button"
          disabled={pending || !picked.length}
          onClick={() => onAdd(picked)}
        >
          {picked.length
            ? `Add ${picked.length} to ${group.name}`
            : "Pick someone to add"}
        </button>
      </section>
    </div>
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
