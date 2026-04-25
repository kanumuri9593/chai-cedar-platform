"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarDays,
  Database,
  DollarSign,
  HardHat,
  Image,
  LayoutDashboard,
  Lock,
  Plus,
  Send
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { currency, projectRecords, scenarioRecords, type ScenarioRecord } from "@/lib/chai-cedar-data";
import { basePath } from "@/lib/site";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type DashboardTab = "overview" | "ledger" | "contractors" | "timeline" | "revenue" | "media" | "scenarios";
type Direction = "investment" | "expense" | "revenue" | "transfer";
type PaymentStatus = "planned" | "due" | "paid" | "cancelled";

type PropertyRow = {
  id: string;
  name: string;
};

type ContractorRow = {
  id: string;
  property_id: string;
  name: string;
  trade: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  active: boolean;
};

type FinanceRow = {
  id: string;
  property_id: string;
  contractor_id: string | null;
  direction: Direction;
  category: string;
  title: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  paid_to: string | null;
  paid_by: string | null;
  invoice_number: string | null;
  notes: string | null;
};

type ContractorPaymentRow = {
  id: string;
  property_id: string;
  contractor_id: string;
  title: string;
  amount: number;
  due_date: string | null;
  paid_date: string | null;
  status: PaymentStatus;
  scope_notes: string | null;
};

type MilestoneRow = {
  id: string;
  property_id: string;
  contractor_id: string | null;
  title: string;
  milestone_date: string | null;
  status: string;
  budget_amount: number;
  actual_amount: number;
  notes: string | null;
};

const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview", label: "Projects", icon: LayoutDashboard },
  { id: "ledger", label: "Money ledger", icon: DollarSign },
  { id: "contractors", label: "Contractors", icon: HardHat },
  { id: "timeline", label: "Timeline", icon: CalendarDays },
  { id: "revenue", label: "Revenue", icon: Database },
  { id: "media", label: "Media", icon: Image },
  { id: "scenarios", label: "AI scenarios", icon: Bot }
];

const demoContractors: ContractorRow[] = [
  {
    id: "demo-contractor-1",
    property_id: "demo-property",
    name: "Local cabin contractor",
    trade: "Cabin / site build",
    company: "TBD",
    phone: null,
    email: null,
    notes: "Use for cabin orientation, shell, deck, and utility coordination.",
    active: true
  }
];

const demoFinance: FinanceRow[] = [
  {
    id: "demo-finance-1",
    property_id: "demo-property",
    contractor_id: null,
    direction: "investment",
    category: "Owner capital",
    title: "Initial land / project investment placeholder",
    amount: 0,
    transaction_date: "2026-04-25",
    payment_method: null,
    paid_to: null,
    paid_by: "Owner",
    invoice_number: null,
    notes: "Replace this with actual money invested so far."
  },
  {
    id: "demo-finance-2",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    direction: "expense",
    category: "Contractor",
    title: "Contractor payment placeholder",
    amount: 0,
    transaction_date: "2026-04-25",
    payment_method: null,
    paid_to: "Local cabin contractor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Track every contractor payment, invoice number, and scope."
  }
];

const demoPayments: ContractorPaymentRow[] = [
  {
    id: "demo-payment-1",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    title: "Cabin orientation and utility trench planning",
    amount: 0,
    due_date: "2026-05-01",
    paid_date: null,
    status: "planned",
    scope_notes: "Use this to plan deposits, progress payments, and final payments."
  }
];

const demoMilestones: MilestoneRow[] = [
  {
    id: "demo-milestone-1",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    title: "Finalize cabin orientation and quote",
    milestone_date: "2026-05-05",
    status: "planned",
    budget_amount: 0,
    actual_amount: 0,
    notes: "Attach contractor, budget, actual, and notes."
  }
];

const mediaRows = [
  { label: "Orchard overview reference", zone: "Orchard", type: "Reference image", status: "Public-ready" },
  { label: "Cabin deck view photos", zone: "Cabin", type: "Photo set", status: "Needed" },
  { label: "Pond edge video sweep", zone: "Pond", type: "Video", status: "Needed" },
  { label: "Drone pass for future model", zone: "Whole property", type: "Drone", status: "Planned" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function SupabaseStatus({ property }: { property: PropertyRow | null }) {
  return (
    <div className="status-pill">
      {isSupabaseConfigured
        ? property
          ? `Supabase live / ${property.name}`
          : "Supabase configured / setup needed"
        : "Demo mode / add Supabase keys"}
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
    if (signInError) setError(signInError.message);
  }

  if (checking) return <main className="dashboard-main">Checking owner access...</main>;

  if (!authed) {
    return (
      <main className="dashboard">
        <div className="dashboard-main" style={{ maxWidth: 520 }}>
          <p className="section-kicker">Owner access</p>
          <h1>
            <Lock size={34} /> Planning cockpit
          </h1>
          <p className="dashboard-muted">Sign in with your Supabase Auth owner user.</p>
          <form className="stack-form" onSubmit={signIn} style={{ marginTop: 24 }}>
            <input aria-label="Email" placeholder="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input
              aria-label="Password"
              placeholder="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function DashboardCockpit() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [property, setProperty] = useState<PropertyRow | null>(isSupabaseConfigured ? null : { id: "demo-property", name: "Three Pond" });
  const [contractors, setContractors] = useState<ContractorRow[]>(demoContractors);
  const [financeRows, setFinanceRows] = useState<FinanceRow[]>(demoFinance);
  const [payments, setPayments] = useState<ContractorPaymentRow[]>(demoPayments);
  const [milestones, setMilestones] = useState<MilestoneRow[]>(demoMilestones);
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>(scenarioRecords);
  const [prompt, setPrompt] = useState("Show a lower cost cabin payment timeline with deposit, rough-in, shell, and final walkthrough.");
  const [message, setMessage] = useState<string | null>(null);

  const [financeForm, setFinanceForm] = useState({
    direction: "expense" as Direction,
    category: "Contractor",
    title: "",
    amount: "",
    transactionDate: today(),
    paymentMethod: "",
    paidTo: "",
    paidBy: "Owner",
    invoiceNumber: "",
    contractorId: "",
    notes: ""
  });

  const [contractorForm, setContractorForm] = useState({
    name: "",
    trade: "",
    company: "",
    phone: "",
    email: "",
    notes: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    contractorId: "",
    title: "",
    amount: "",
    dueDate: today(),
    paidDate: "",
    status: "planned" as PaymentStatus,
    scopeNotes: ""
  });

  const [milestoneForm, setMilestoneForm] = useState({
    contractorId: "",
    title: "",
    milestoneDate: today(),
    status: "planned",
    budgetAmount: "",
    actualAmount: "",
    notes: ""
  });

  async function reloadSupabaseData() {
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    let { data: properties, error: propertyError } = await supabase
      .from("properties")
      .select("id,name")
      .eq("slug", "three-pond")
      .limit(1);

    if (!propertyError && (!properties || properties.length === 0)) {
      const inserted = await supabase
        .from("properties")
        .insert({
          owner_id: user.id,
          name: "Three Pond",
          slug: "three-pond",
          acreage: 2,
          location_label: "Chai & Cedar first property",
          public_visible: false
        })
        .select("id,name")
        .single();
      if (!inserted.error && inserted.data) properties = [inserted.data];
    }

    const activeProperty = properties?.[0] as PropertyRow | undefined;
    if (!activeProperty) return;
    setProperty(activeProperty);

    const [contractorsResult, financeResult, paymentsResult, milestonesResult] = await Promise.all([
      supabase.from("contractors").select("*").eq("property_id", activeProperty.id).order("created_at", { ascending: false }),
      supabase
        .from("financial_transactions")
        .select("*")
        .eq("property_id", activeProperty.id)
        .order("transaction_date", { ascending: false }),
      supabase
        .from("contractor_payments")
        .select("*")
        .eq("property_id", activeProperty.id)
        .order("due_date", { ascending: true }),
      supabase
        .from("project_milestones")
        .select("*")
        .eq("property_id", activeProperty.id)
        .order("milestone_date", { ascending: true })
    ]);

    if (!contractorsResult.error) setContractors((contractorsResult.data ?? []) as ContractorRow[]);
    if (!financeResult.error) setFinanceRows((financeResult.data ?? []) as FinanceRow[]);
    if (!paymentsResult.error) setPayments((paymentsResult.data ?? []) as ContractorPaymentRow[]);
    if (!milestonesResult.error) setMilestones((milestonesResult.data ?? []) as MilestoneRow[]);
  }

  useEffect(() => {
    reloadSupabaseData();
  }, []);

  const totals = useMemo(() => {
    const invested = financeRows.filter((row) => row.direction === "investment").reduce((sum, row) => sum + row.amount, 0);
    const spent = financeRows.filter((row) => row.direction === "expense").reduce((sum, row) => sum + row.amount, 0);
    const revenue = financeRows.filter((row) => row.direction === "revenue").reduce((sum, row) => sum + row.amount, 0);
    const contractorPaid = payments.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amount, 0);
    const contractorDue = payments.filter((row) => row.status !== "paid").reduce((sum, row) => sum + row.amount, 0);
    return {
      invested,
      spent,
      revenue,
      contractorPaid,
      contractorDue,
      netCash: invested + revenue - spent
    };
  }, [financeRows, payments]);

  async function addContractor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;

    const row: ContractorRow = {
      id: `contractor-${Date.now()}`,
      property_id: property.id,
      name: contractorForm.name,
      trade: contractorForm.trade,
      company: contractorForm.company || null,
      phone: contractorForm.phone || null,
      email: contractorForm.email || null,
      notes: contractorForm.notes || null,
      active: true
    };

    if (supabase) {
      const { error } = await supabase.from("contractors").insert({ ...row, id: undefined });
      if (error) {
        setMessage(error.message);
        return;
      }
      await reloadSupabaseData();
    } else {
      setContractors((current) => [row, ...current]);
    }

    setContractorForm({ name: "", trade: "", company: "", phone: "", email: "", notes: "" });
    setMessage("Contractor saved.");
  }

  async function addFinance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;

    const row: FinanceRow = {
      id: `finance-${Date.now()}`,
      property_id: property.id,
      contractor_id: financeForm.contractorId || null,
      direction: financeForm.direction,
      category: financeForm.category,
      title: financeForm.title,
      amount: toNumber(financeForm.amount),
      transaction_date: financeForm.transactionDate,
      payment_method: financeForm.paymentMethod || null,
      paid_to: financeForm.paidTo || null,
      paid_by: financeForm.paidBy || null,
      invoice_number: financeForm.invoiceNumber || null,
      notes: financeForm.notes || null
    };

    if (supabase) {
      const { error } = await supabase.from("financial_transactions").insert({ ...row, id: undefined });
      if (error) {
        setMessage(error.message);
        return;
      }
      await reloadSupabaseData();
    } else {
      setFinanceRows((current) => [row, ...current]);
    }

    setFinanceForm((current) => ({ ...current, title: "", amount: "", paidTo: "", invoiceNumber: "", notes: "" }));
    setMessage("Money entry saved.");
  }

  async function addPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property || !paymentForm.contractorId) return;

    const row: ContractorPaymentRow = {
      id: `payment-${Date.now()}`,
      property_id: property.id,
      contractor_id: paymentForm.contractorId,
      title: paymentForm.title,
      amount: toNumber(paymentForm.amount),
      due_date: paymentForm.dueDate || null,
      paid_date: paymentForm.paidDate || null,
      status: paymentForm.status,
      scope_notes: paymentForm.scopeNotes || null
    };

    if (supabase) {
      const { error } = await supabase.from("contractor_payments").insert({ ...row, id: undefined });
      if (error) {
        setMessage(error.message);
        return;
      }
      await reloadSupabaseData();
    } else {
      setPayments((current) => [row, ...current]);
    }

    setPaymentForm((current) => ({ ...current, title: "", amount: "", scopeNotes: "" }));
    setMessage("Contractor payment saved.");
  }

  async function addMilestone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!property) return;

    const row: MilestoneRow = {
      id: `milestone-${Date.now()}`,
      property_id: property.id,
      contractor_id: milestoneForm.contractorId || null,
      title: milestoneForm.title,
      milestone_date: milestoneForm.milestoneDate || null,
      status: milestoneForm.status,
      budget_amount: toNumber(milestoneForm.budgetAmount),
      actual_amount: toNumber(milestoneForm.actualAmount),
      notes: milestoneForm.notes || null
    };

    if (supabase) {
      const { error } = await supabase.from("project_milestones").insert({ ...row, id: undefined });
      if (error) {
        setMessage(error.message);
        return;
      }
      await reloadSupabaseData();
    } else {
      setMilestones((current) => [row, ...current]);
    }

    setMilestoneForm((current) => ({ ...current, title: "", budgetAmount: "", actualAmount: "", notes: "" }));
    setMessage("Timeline milestone saved.");
  }

  async function createScenarioDraft() {
    const draft: ScenarioRecord = {
      id: `scenario-${Date.now()}`,
      title: "AI draft scenario",
      state: "draft",
      prompt,
      changeSummary: "Draft created for owner review. Production mode stores a scene patch and finance/timeline notes.",
      estimatedImpact: "Pending AI cost, revenue, and build complexity analysis."
    };

    setScenarios((current) => [draft, ...current]);

    if (supabase) {
      await supabase.from("scenario_versions").insert({
        property_id: property?.id ?? null,
        title: draft.title,
        state: "draft",
        prompt: draft.prompt,
        change_summary: draft.changeSummary,
        estimated_impact: draft.estimatedImpact,
        scene_patch: { source: "dashboard", status: "draft_pending_edge_function" }
      });
    }
  }

  const contractorName = (id: string | null) => contractors.find((contractor) => contractor.id === id)?.name ?? "Unassigned";

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
                  <button className={activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => setActiveTab(tab.id)}>
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
                <h1>Track every dollar, contractor, and deadline.</h1>
                <p className="dashboard-muted">
                  Enter investments, expenses, contractor payments, due dates, paid dates, invoices, notes, and build
                  milestones for the Three Pond property.
                </p>
              </div>
              <SupabaseStatus property={property} />
            </div>

            {message && <p className="notice">{message}</p>}

            <div className="metric-row">
              <div className="metric">
                <strong>{currency(totals.invested)}</strong>
                <span className="dashboard-muted">money invested</span>
              </div>
              <div className="metric">
                <strong>{currency(totals.spent)}</strong>
                <span className="dashboard-muted">total spent</span>
              </div>
              <div className="metric">
                <strong>{currency(totals.contractorPaid)}</strong>
                <span className="dashboard-muted">paid to contractors</span>
              </div>
              <div className="metric">
                <strong>{currency(totals.contractorDue)}</strong>
                <span className="dashboard-muted">planned / due payments</span>
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
                      <h2>Cash position</h2>
                      <div className="ledger-row">
                        <div>
                          <strong>{currency(totals.netCash)}</strong>
                          <p>Investment plus revenue minus expenses entered so far.</p>
                        </div>
                        <span className="status-pill">live</span>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "ledger" && (
                  <div className="workspace-grid">
                    <section className="workspace-panel">
                      <h2>Add money entry</h2>
                      <form className="stack-form" onSubmit={addFinance}>
                        <div className="form-grid">
                          <Field label="Type">
                            <select
                              value={financeForm.direction}
                              onChange={(event) => setFinanceForm((current) => ({ ...current, direction: event.target.value as Direction }))}
                            >
                              <option value="investment">Investment</option>
                              <option value="expense">Expense</option>
                              <option value="revenue">Revenue</option>
                              <option value="transfer">Transfer</option>
                            </select>
                          </Field>
                          <Field label="Amount">
                            <input
                              inputMode="decimal"
                              placeholder="0"
                              value={financeForm.amount}
                              onChange={(event) => setFinanceForm((current) => ({ ...current, amount: event.target.value }))}
                            />
                          </Field>
                          <Field label="Date">
                            <input
                              type="date"
                              value={financeForm.transactionDate}
                              onChange={(event) => setFinanceForm((current) => ({ ...current, transactionDate: event.target.value }))}
                            />
                          </Field>
                          <Field label="Category">
                            <input
                              placeholder="Contractor, materials, owner capital"
                              value={financeForm.category}
                              onChange={(event) => setFinanceForm((current) => ({ ...current, category: event.target.value }))}
                            />
                          </Field>
                        </div>
                        <Field label="Title">
                          <input
                            required
                            placeholder="What was paid or invested?"
                            value={financeForm.title}
                            onChange={(event) => setFinanceForm((current) => ({ ...current, title: event.target.value }))}
                          />
                        </Field>
                        <div className="form-grid">
                          <Field label="Contractor">
                            <select
                              value={financeForm.contractorId}
                              onChange={(event) => setFinanceForm((current) => ({ ...current, contractorId: event.target.value }))}
                            >
                              <option value="">No contractor</option>
                              {contractors.map((contractor) => (
                                <option key={contractor.id} value={contractor.id}>
                                  {contractor.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Paid to">
                            <input value={financeForm.paidTo} onChange={(event) => setFinanceForm((current) => ({ ...current, paidTo: event.target.value }))} />
                          </Field>
                          <Field label="Paid by">
                            <input value={financeForm.paidBy} onChange={(event) => setFinanceForm((current) => ({ ...current, paidBy: event.target.value }))} />
                          </Field>
                          <Field label="Invoice #">
                            <input
                              value={financeForm.invoiceNumber}
                              onChange={(event) => setFinanceForm((current) => ({ ...current, invoiceNumber: event.target.value }))}
                            />
                          </Field>
                        </div>
                        <Field label="Notes">
                          <textarea value={financeForm.notes} onChange={(event) => setFinanceForm((current) => ({ ...current, notes: event.target.value }))} />
                        </Field>
                        <button className="solid-link" type="submit">
                          <Plus size={16} /> Save money entry
                        </button>
                      </form>
                    </section>

                    <section className="workspace-panel">
                      <h2>Ledger</h2>
                      {financeRows.map((row) => (
                        <div className="ledger-row" key={row.id}>
                          <div>
                            <strong>{row.title}</strong>
                            <p>
                              {row.transaction_date} / {row.category} / {contractorName(row.contractor_id)}
                            </p>
                          </div>
                          <span className="status-pill">
                            {row.direction} / {currency(row.amount)}
                          </span>
                        </div>
                      ))}
                    </section>
                  </div>
                )}

                {activeTab === "contractors" && (
                  <div className="workspace-grid">
                    <section className="workspace-panel">
                      <h2>Add contractor</h2>
                      <form className="stack-form" onSubmit={addContractor}>
                        <div className="form-grid">
                          <Field label="Name">
                            <input required value={contractorForm.name} onChange={(event) => setContractorForm((current) => ({ ...current, name: event.target.value }))} />
                          </Field>
                          <Field label="Trade">
                            <input required placeholder="Cabin, excavation, electric" value={contractorForm.trade} onChange={(event) => setContractorForm((current) => ({ ...current, trade: event.target.value }))} />
                          </Field>
                          <Field label="Company">
                            <input value={contractorForm.company} onChange={(event) => setContractorForm((current) => ({ ...current, company: event.target.value }))} />
                          </Field>
                          <Field label="Phone">
                            <input value={contractorForm.phone} onChange={(event) => setContractorForm((current) => ({ ...current, phone: event.target.value }))} />
                          </Field>
                        </div>
                        <Field label="Notes">
                          <textarea value={contractorForm.notes} onChange={(event) => setContractorForm((current) => ({ ...current, notes: event.target.value }))} />
                        </Field>
                        <button className="solid-link" type="submit">
                          <Plus size={16} /> Save contractor
                        </button>
                      </form>
                    </section>

                    <section className="workspace-panel">
                      <h2>Contractor payment schedule</h2>
                      <form className="stack-form" onSubmit={addPayment}>
                        <Field label="Contractor">
                          <select required value={paymentForm.contractorId} onChange={(event) => setPaymentForm((current) => ({ ...current, contractorId: event.target.value }))}>
                            <option value="">Choose contractor</option>
                            {contractors.map((contractor) => (
                              <option key={contractor.id} value={contractor.id}>
                                {contractor.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <div className="form-grid">
                          <Field label="Payment title">
                            <input required value={paymentForm.title} onChange={(event) => setPaymentForm((current) => ({ ...current, title: event.target.value }))} />
                          </Field>
                          <Field label="Amount">
                            <input value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} />
                          </Field>
                          <Field label="Due">
                            <input type="date" value={paymentForm.dueDate} onChange={(event) => setPaymentForm((current) => ({ ...current, dueDate: event.target.value }))} />
                          </Field>
                          <Field label="Status">
                            <select value={paymentForm.status} onChange={(event) => setPaymentForm((current) => ({ ...current, status: event.target.value as PaymentStatus }))}>
                              <option value="planned">Planned</option>
                              <option value="due">Due</option>
                              <option value="paid">Paid</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </Field>
                        </div>
                        <Field label="Scope">
                          <textarea value={paymentForm.scopeNotes} onChange={(event) => setPaymentForm((current) => ({ ...current, scopeNotes: event.target.value }))} />
                        </Field>
                        <button className="solid-link" type="submit">
                          <Plus size={16} /> Save payment
                        </button>
                      </form>

                      {payments.map((payment) => (
                        <div className="ledger-row" key={payment.id}>
                          <div>
                            <strong>{payment.title}</strong>
                            <p>
                              {contractorName(payment.contractor_id)} / due {payment.due_date ?? "TBD"}
                            </p>
                          </div>
                          <span className="status-pill">
                            {payment.status} / {currency(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </section>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="workspace-grid">
                    <section className="workspace-panel">
                      <h2>Add timeline milestone</h2>
                      <form className="stack-form" onSubmit={addMilestone}>
                        <Field label="Title">
                          <input required value={milestoneForm.title} onChange={(event) => setMilestoneForm((current) => ({ ...current, title: event.target.value }))} />
                        </Field>
                        <div className="form-grid">
                          <Field label="Date">
                            <input type="date" value={milestoneForm.milestoneDate} onChange={(event) => setMilestoneForm((current) => ({ ...current, milestoneDate: event.target.value }))} />
                          </Field>
                          <Field label="Status">
                            <input value={milestoneForm.status} onChange={(event) => setMilestoneForm((current) => ({ ...current, status: event.target.value }))} />
                          </Field>
                          <Field label="Budget">
                            <input value={milestoneForm.budgetAmount} onChange={(event) => setMilestoneForm((current) => ({ ...current, budgetAmount: event.target.value }))} />
                          </Field>
                          <Field label="Actual">
                            <input value={milestoneForm.actualAmount} onChange={(event) => setMilestoneForm((current) => ({ ...current, actualAmount: event.target.value }))} />
                          </Field>
                        </div>
                        <Field label="Contractor">
                          <select value={milestoneForm.contractorId} onChange={(event) => setMilestoneForm((current) => ({ ...current, contractorId: event.target.value }))}>
                            <option value="">No contractor</option>
                            {contractors.map((contractor) => (
                              <option key={contractor.id} value={contractor.id}>
                                {contractor.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Notes">
                          <textarea value={milestoneForm.notes} onChange={(event) => setMilestoneForm((current) => ({ ...current, notes: event.target.value }))} />
                        </Field>
                        <button className="solid-link" type="submit">
                          <Plus size={16} /> Save milestone
                        </button>
                      </form>
                    </section>

                    <section className="workspace-panel">
                      <h2>Timeline</h2>
                      {milestones.map((milestone) => (
                        <div className="project-row" key={milestone.id}>
                          <div>
                            <strong>{milestone.title}</strong>
                            <p>
                              {milestone.milestone_date ?? "No date"} / {contractorName(milestone.contractor_id)} / budget{" "}
                              {currency(milestone.budget_amount)} / actual {currency(milestone.actual_amount)}
                            </p>
                          </div>
                          <span className="status-pill">{milestone.status}</span>
                        </div>
                      ))}
                    </section>
                  </div>
                )}

                {activeTab === "revenue" && (
                  <section className="workspace-panel">
                    <h2>Revenue entries</h2>
                    {financeRows
                      .filter((row) => row.direction === "revenue")
                      .map((row) => (
                        <div className="ledger-row" key={row.id}>
                          <div>
                            <strong>{row.title}</strong>
                            <p>{row.transaction_date} / {row.category}</p>
                          </div>
                          <span className="status-pill">{currency(row.amount)}</span>
                        </div>
                      ))}
                    {financeRows.filter((row) => row.direction === "revenue").length === 0 && (
                      <p className="dashboard-muted">Add revenue from the Money ledger tab using type Revenue.</p>
                    )}
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
                          Use this for rapid prototypes: payment schedules, cheaper build options, alternate 3D layout
                          versions, and cost-risk notes. Drafts require owner approval.
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
