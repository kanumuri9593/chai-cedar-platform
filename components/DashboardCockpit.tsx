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
    id: "seed-land",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Land",
    title: "Land",
    amount: 18000,
    transaction_date: "2025-01-01",
    payment_method: null,
    paid_to: "Land acquisition / seller",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Imported from Three Pond investment tracker. Attach closing docs or receipt."
  },
  {
    id: "seed-development",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    direction: "expense",
    category: "Development",
    title: "Development",
    amount: 18000,
    transaction_date: "2025-01-05",
    payment_method: null,
    paid_to: "Site development",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Imported from tracker. Add contractor scope, invoice, and receipts."
  },
  {
    id: "seed-canvas-tent-main",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "CanvasCamp",
    title: "Canvas tent",
    amount: 4000,
    transaction_date: "2025-02-01",
    payment_method: null,
    paid_to: "Canvas tent vendor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Main 20x20 tent platform experience."
  },
  {
    id: "seed-deck",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Deck",
    title: "Deck",
    amount: 2000,
    transaction_date: "2025-02-15",
    payment_method: null,
    paid_to: "Materials / labor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Attach material receipts and build photos."
  },
  {
    id: "seed-cedar-boat",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Pond",
    title: "Cedar boat",
    amount: 900,
    transaction_date: "2025-03-01",
    payment_method: null,
    paid_to: "Boat seller",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Guest amenity / pond experience."
  },
  {
    id: "seed-chair-table",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Hospitality",
    title: "Chair table set",
    amount: 220,
    transaction_date: "2025-03-12",
    payment_method: null,
    paid_to: "Furniture vendor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Outdoor seating."
  },
  {
    id: "seed-yarbo",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Equipment",
    title: "Yarbo lawn mower",
    amount: 2450,
    transaction_date: "2025-03-20",
    payment_method: null,
    paid_to: "Yarbo",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Try to sell this."
  },
  {
    id: "seed-well",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    direction: "expense",
    category: "Well",
    title: "Well",
    amount: 13000,
    transaction_date: "2025-04-01",
    payment_method: null,
    paid_to: "Well contractor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Critical utility. Add permit, depth, flow report, invoice, and photos."
  },
  {
    id: "seed-septic",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    direction: "expense",
    category: "Septic",
    title: "Septic",
    amount: 11000,
    transaction_date: "2025-04-10",
    payment_method: null,
    paid_to: "Septic contractor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Attach approved design, invoice, and inspection."
  },
  {
    id: "seed-linens",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Hospitality",
    title: "India linens",
    amount: 150,
    transaction_date: "2025-04-20",
    payment_method: null,
    paid_to: "Linens vendor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Guest setup."
  },
  {
    id: "seed-red-barn",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Barn",
    title: "Red barn shed",
    amount: 5200,
    transaction_date: "2025-05-01",
    payment_method: null,
    paid_to: "Shed vendor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Operational storage and road-side asset."
  },
  {
    id: "seed-permissions",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Permits",
    title: "Ben permissions fee",
    amount: 2000,
    transaction_date: "2025-05-10",
    payment_method: null,
    paid_to: "Ben / permits",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Clarify permit scope and attach docs."
  },
  {
    id: "seed-canvas-tent-extra",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "CanvasCamp",
    title: "Canvas tent",
    amount: 600,
    transaction_date: "2025-05-18",
    payment_method: null,
    paid_to: "Tent vendor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Additional tent setup cost."
  },
  {
    id: "seed-canvas-stove",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "CanvasCamp",
    title: "Canvas tent stove",
    amount: 600,
    transaction_date: "2025-05-22",
    payment_method: null,
    paid_to: "Stove vendor",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Cold-weather tent upgrade."
  },
  {
    id: "seed-misc-2025",
    property_id: "demo-property",
    contractor_id: null,
    direction: "expense",
    category: "Misc",
    title: "Miscellaneous purchase in 2025",
    amount: 1000,
    transaction_date: "2025-06-01",
    payment_method: null,
    paid_to: "Various",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Break out later into detailed receipts."
  },
  {
    id: "seed-soil-test",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    direction: "expense",
    category: "Septic",
    title: "Septic and soil test",
    amount: 1575,
    transaction_date: "2025-06-12",
    payment_method: null,
    paid_to: "Soil / septic tester",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Attach test report."
  },
  {
    id: "seed-septic-hole",
    property_id: "demo-property",
    contractor_id: "demo-contractor-1",
    direction: "expense",
    category: "Septic",
    title: "Septic hole",
    amount: 500,
    transaction_date: "2025-06-20",
    payment_method: null,
    paid_to: "Excavation",
    paid_by: "Owner",
    invoice_number: null,
    notes: "Attach excavation photos."
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
          ? property.id === "demo-property"
            ? `Password mode / local ${property.name}`
            : `Supabase live / ${property.name}`
          : "Password mode / local until Supabase session"
        : "Demo mode / add Supabase keys"}
    </div>
  );
}

const ownerPassword = process.env.NEXT_PUBLIC_OWNER_PASSWORD || "cedar2026";

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUnlocked(window.localStorage.getItem("chai-cedar-owner-unlocked") === "true");
    setChecking(false);
  }, []);

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password === ownerPassword) {
      window.localStorage.setItem("chai-cedar-owner-unlocked", "true");
      setUnlocked(true);
      return;
    }
    setError("Wrong password.");
  }

  if (checking) return <main className="dashboard-main">Checking owner access...</main>;

  if (!unlocked) {
    return (
      <main className="dashboard">
        <div className="dashboard-main" style={{ maxWidth: 520 }}>
          <p className="section-kicker">Owner access</p>
          <h1>
            <Lock size={34} /> Planning cockpit
          </h1>
          <p className="dashboard-muted">
            Enter the shared Chai & Cedar owner password. This keeps the screen simple for you and your wife.
          </p>
          <form className="stack-form" onSubmit={unlock} style={{ marginTop: 24 }}>
            <input
              aria-label="Owner password"
              placeholder="owner password"
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

function readStoredRows<T>(key: string, fallback: T[]) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredRows<T>(key: string, rows: T[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(rows));
  }
}

const trackerSeedTotal = demoFinance.reduce((sum, row) => sum + row.amount, 0);

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
  const [property, setProperty] = useState<PropertyRow | null>({ id: "demo-property", name: "Three Pond" });
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
    if (!user) {
      setProperty({ id: "demo-property", name: "Three Pond" });
      setContractors(readStoredRows("chai-cedar-contractors", demoContractors));
      setFinanceRows(readStoredRows("chai-cedar-finance", demoFinance));
      setPayments(readStoredRows("chai-cedar-payments", demoPayments));
      setMilestones(readStoredRows("chai-cedar-milestones", demoMilestones));
      return;
    }

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

  useEffect(() => {
    if (property?.id === "demo-property") writeStoredRows("chai-cedar-contractors", contractors);
  }, [contractors, property?.id]);

  useEffect(() => {
    if (property?.id === "demo-property") writeStoredRows("chai-cedar-finance", financeRows);
  }, [financeRows, property?.id]);

  useEffect(() => {
    if (property?.id === "demo-property") writeStoredRows("chai-cedar-payments", payments);
  }, [payments, property?.id]);

  useEffect(() => {
    if (property?.id === "demo-property") writeStoredRows("chai-cedar-milestones", milestones);
  }, [milestones, property?.id]);

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

    if (supabase && property.id !== "demo-property") {
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

    if (supabase && property.id !== "demo-property") {
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

    if (supabase && property.id !== "demo-property") {
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

    if (supabase && property.id !== "demo-property") {
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

    if (supabase && property?.id !== "demo-property") {
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

  function importTrackerSeed() {
    setFinanceRows(demoFinance);
    setContractors(demoContractors);
    setPayments(demoPayments);
    setMilestones(demoMilestones);
    setMessage(`Imported Three Pond tracker seed: ${currency(trackerSeedTotal)} across ${demoFinance.length} entries.`);
  }

  return (
    <PasswordGate>
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
                      <div className="ledger-row">
                        <div>
                          <strong>Tracker import</strong>
                          <p>Seed from the screenshot: land, development, tent, deck, well, septic, barn, permits, and supplies.</p>
                        </div>
                        <button className="tool-button" onClick={importTrackerSeed}>
                          Import {currency(trackerSeedTotal)}
                        </button>
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
                      <div className="panel-title-row">
                        <h2>Ledger</h2>
                        <button className="tool-button" onClick={importTrackerSeed}>
                          Reset to screenshot seed
                        </button>
                      </div>
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
    </PasswordGate>
  );
}
