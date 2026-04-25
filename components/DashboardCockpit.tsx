"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, CalendarDays, Database, DollarSign, Image, LayoutDashboard, Lock, Send, Trees } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  currency,
  projectRecords,
  scenarioRecords,
  type ScenarioRecord
} from "@/lib/chai-cedar-data";
import { basePath } from "@/lib/site";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type DashboardTab = "overview" | "timeline" | "expenses" | "revenue" | "media" | "scenarios";

const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview", label: "Projects", icon: LayoutDashboard },
  { id: "timeline", label: "Timeline", icon: CalendarDays },
  { id: "expenses", label: "Expenses", icon: DollarSign },
  { id: "revenue", label: "Revenue", icon: Database },
  { id: "media", label: "Media", icon: Image },
  { id: "scenarios", label: "AI scenarios", icon: Bot }
];

const expenseRows = [
  { label: "CanvasCamp platform and setup", project: "CanvasCamp", amount: 3800, status: "Actual" },
  { label: "Orchard first plant order", project: "Orchard", amount: 2200, status: "Actual" },
  { label: "Cabin utility trench allowance", project: "Cabin", amount: 18000, status: "Forecast" },
  { label: "Play area phase 1", project: "Viaan Play", amount: 9500, status: "Forecast" }
];

const revenueRows = [
  { label: "Cabin annual STR target", source: "Airbnb / direct", amount: 52000, status: "Projected" },
  { label: "CanvasCamp annual glamping target", source: "Hipcamp / Airbnb", amount: 18000, status: "Projected" },
  { label: "Orchard experience lift", source: "Booking conversion", amount: 8500, status: "Projected" },
  { label: "Family amenity lift", source: "Premium stays", amount: 7000, status: "Projected" }
];

const mediaRows = [
  { label: "Orchard overview reference", zone: "Orchard", type: "Reference image", status: "Public-ready" },
  { label: "Cabin deck view photos", zone: "Cabin", type: "Photo set", status: "Needed" },
  { label: "Pond edge video sweep", zone: "Pond", type: "Video", status: "Needed" },
  { label: "Drone pass for future model", zone: "Whole property", type: "Drone", status: "Planned" }
];

function SupabaseStatus() {
  return (
    <div className="status-pill">
      {isSupabaseConfigured ? "Supabase configured" : "Demo mode / add .env.local Supabase keys"}
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(!isSupabaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setAuthed(Boolean(data.user));
      setChecking(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
    }
  }

  if (checking) {
    return <main className="dashboard-main">Checking owner access...</main>;
  }

  if (!authed) {
    return (
      <main className="dashboard">
        <div className="dashboard-main" style={{ maxWidth: 520 }}>
          <p className="section-kicker">Owner access</p>
          <h1>
            <Lock size={34} /> Planning cockpit
          </h1>
          <p className="dashboard-muted">
            This dashboard is private. Sign in with a Supabase Auth user from your Chai & Cedar project.
          </p>
          <form className="ai-console" onSubmit={signIn} style={{ marginTop: 24 }}>
            <input
              aria-label="Email"
              placeholder="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{
                background: "rgba(0,0,0,.22)",
                border: "1px solid rgba(244,238,223,.14)",
                borderRadius: 8,
                color: "#f4eedf",
                minHeight: 46,
                padding: 12
              }}
            />
            <input
              aria-label="Password"
              placeholder="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{
                background: "rgba(0,0,0,.22)",
                border: "1px solid rgba(244,238,223,.14)",
                borderRadius: 8,
                color: "#f4eedf",
                minHeight: 46,
                padding: 12
              }}
            />
            {error && <p style={{ color: "#f2a4a4" }}>{error}</p>}
            <button className="solid-link" type="submit" style={{ justifyContent: "center" }}>
              Sign in
            </button>
          </form>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

export function DashboardCockpit() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [prompt, setPrompt] = useState(
    "Show night mode with warm orchard lights, one pond sitting node, and no overbuilding."
  );
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>(scenarioRecords);

  const totals = useMemo(() => {
    const estimated = projectRecords.reduce((sum, project) => sum + project.estimatedCost, 0);
    const actual = projectRecords.reduce((sum, project) => sum + project.actualCost, 0);
    const revenue = projectRecords.reduce((sum, project) => sum + project.projectedAnnualRevenue, 0);
    return { estimated, actual, revenue, openProjects: projectRecords.length };
  }, []);

  async function createScenarioDraft() {
    const draft: ScenarioRecord = {
      id: `scenario-${Date.now()}`,
      title: "AI draft scenario",
      state: "draft",
      prompt,
      changeSummary:
        "Draft created for owner review. In production this calls the Supabase Edge Function, stores a scene patch, and waits for approval.",
      estimatedImpact: "Pending AI cost, revenue, and build complexity analysis."
    };

    setScenarios((current) => [draft, ...current]);

    if (supabase) {
      await supabase.from("scenario_versions").insert({
        title: draft.title,
        state: "draft",
        prompt: draft.prompt,
        change_summary: draft.changeSummary,
        estimated_impact: draft.estimatedImpact,
        scene_patch: { source: "dashboard", status: "draft_pending_edge_function" }
      });
    }
  }

  return (
    <AuthGate>
      <main className="dashboard">
        <div className="dashboard-layout">
          <aside className="sidebar">
            <a className="brand-mark" href={`${basePath}/`}>
              <span className="brand-seal">C</span>
              <span>Chai & Cedar</span>
            </a>
            <nav aria-label="Dashboard sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    className={activeTab === tab.id ? "active" : ""}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>
          <section className="dashboard-main">
            <div className="dashboard-top">
              <div>
                <p className="section-kicker">Private planning cockpit</p>
                <h1>Build the land like an operating system.</h1>
                <p className="dashboard-muted">
                  Track projects, expenses, revenue, media, and AI-generated 3D scenario drafts before money gets
                  committed.
                </p>
              </div>
              <SupabaseStatus />
            </div>

            <div className="metric-row">
              <div className="metric">
                <strong>{totals.openProjects}</strong>
                <span className="dashboard-muted">active build zones</span>
              </div>
              <div className="metric">
                <strong>{currency(totals.estimated)}</strong>
                <span className="dashboard-muted">estimated investment</span>
              </div>
              <div className="metric">
                <strong>{currency(totals.actual)}</strong>
                <span className="dashboard-muted">tracked actuals</span>
              </div>
              <div className="metric">
                <strong>{currency(totals.revenue)}</strong>
                <span className="dashboard-muted">annual revenue target</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "overview" && (
                  <div className="workspace-grid">
                    <section className="workspace-panel">
                      <h2>Project board</h2>
                      {projectRecords.map((project) => (
                        <div className="project-row" key={project.id}>
                          <div>
                            <strong>{project.title}</strong>
                            <p>{project.nextStep}</p>
                          </div>
                          <span className="status-pill">
                            {project.priority} / {project.status}
                          </span>
                        </div>
                      ))}
                    </section>
                    <section className="workspace-panel">
                      <h2>Owner rules</h2>
                      <p className="dashboard-muted">
                        Build debt-free, preserve nature, use local builders for leverage, DIY where learning
                        compounds, and keep every change tied to guest value or long-term asset value.
                      </p>
                    </section>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <section className="workspace-panel">
                    <h2>Wrap-it-up-this-year timeline</h2>
                    {["Cabin orientation and utilities", "Tent guest path and firepit", "Orchard first planting", "Pond sitting node", "Play area phase 1"].map(
                      (item, index) => (
                        <div className="project-row" key={item}>
                          <div>
                            <strong>{item}</strong>
                            <p>Phase {index + 1}: keep scope tight, inspect cost, then commit.</p>
                          </div>
                          <span className="status-pill">{index < 2 ? "Now" : "Next"}</span>
                        </div>
                      )
                    )}
                  </section>
                )}

                {activeTab === "expenses" && (
                  <section className="workspace-panel">
                    <h2>Expense ledger</h2>
                    {expenseRows.map((row) => (
                      <div className="ledger-row" key={row.label}>
                        <div>
                          <strong>{row.label}</strong>
                          <p>{row.project}</p>
                        </div>
                        <span className="status-pill">
                          {currency(row.amount)} / {row.status}
                        </span>
                      </div>
                    ))}
                  </section>
                )}

                {activeTab === "revenue" && (
                  <section className="workspace-panel">
                    <h2>Revenue tracker</h2>
                    {revenueRows.map((row) => (
                      <div className="ledger-row" key={row.label}>
                        <div>
                          <strong>{row.label}</strong>
                          <p>{row.source}</p>
                        </div>
                        <span className="status-pill">
                          {currency(row.amount)} / {row.status}
                        </span>
                      </div>
                    ))}
                  </section>
                )}

                {activeTab === "media" && (
                  <section className="workspace-panel">
                    <h2>Media library</h2>
                    {mediaRows.map((row) => (
                      <div className="ledger-row" key={row.label}>
                        <div>
                          <strong>{row.label}</strong>
                          <p>
                            {row.zone} / {row.type}
                          </p>
                        </div>
                        <span className="status-pill">{row.status}</span>
                      </div>
                    ))}
                  </section>
                )}

                {activeTab === "scenarios" && (
                  <div className="workspace-grid">
                    <section className="workspace-panel">
                      <h2>AI scenario console</h2>
                      <div className="ai-console">
                        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
                        <button className="solid-link" onClick={createScenarioDraft}>
                          <Send size={16} /> Create draft scenario
                        </button>
                        <p className="dashboard-muted">
                          Drafts are stored for review. Production mode routes this through a Supabase Edge Function
                          that generates a scene patch, cost notes, and risk notes.
                        </p>
                      </div>
                    </section>
                    <section className="workspace-panel">
                      <h2>Scenario versions</h2>
                      {scenarios.map((scenario) => (
                        <div className="scenario-row" key={scenario.id}>
                          <div>
                            <strong>{scenario.title}</strong>
                            <p>{scenario.changeSummary}</p>
                          </div>
                          <span className="status-pill">{scenario.state}</span>
                        </div>
                      ))}
                    </section>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
