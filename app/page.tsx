import { LandExperience, ExploreButton } from "@/components/LandExperience";
import { orchardPlan, landSceneObjects } from "@/lib/chai-cedar-data";
import { basePath } from "@/lib/site";

const beliefs = [
  {
    title: "Nature first",
    copy: "The pond, forest, and orchard are the luxury. The buildings exist to frame them."
  },
  {
    title: "Debt-free assets",
    copy: "Build one stone at a time, reinvesting into durable land value instead of fragile hype."
  },
  {
    title: "Local craft",
    copy: "Collaborate with local builders where precision matters and DIY everywhere it compounds learning."
  },
  {
    title: "Blueprint business",
    copy: "Turn this first property into a repeatable value-add system for future owners and retreat operators."
  }
];

const blueprintItems = [
  {
    title: "3D land model as operating truth",
    copy: "Every structure, path, view, and future idea becomes a versioned object that can be compared before money is spent."
  },
  {
    title: "Media grows the world",
    copy: "Photos, videos, drone clips, receipts, and future scans are tagged to zones so the model gets richer over time."
  },
  {
    title: "AI drafts, owner decides",
    copy: "Chat prompts can propose new layouts, costs, and scenarios, but changes stay drafts until reviewed."
  },
  {
    title: "Private cockpit behind the dream",
    copy: "Timelines, expenses, revenue, vendors, and next steps live behind auth while the public site sells the vision."
  }
];

export default function Home() {
  return (
    <main className="app-shell">
      <nav className="nav" aria-label="Primary navigation">
        <a className="brand-mark" href="#">
          <span className="brand-seal">C</span>
          <span>Chai & Cedar</span>
        </a>
        <div className="nav-actions">
          <a className="ghost-link" href="#vision">
            Vision
          </a>
          <a className="ghost-link" href="#land-system">
            Land system
          </a>
          <a className="solid-link" href={`${basePath}/dashboard/`}>
            Owner cockpit
          </a>
        </div>
      </nav>

      <section className="hero">
        <LandExperience />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Three Pond location / first 2-acre property</p>
          <h1 className="hero-title">Chai & Cedar</h1>
          <p className="hero-subtitle">
            A nature-first retreat built debt-free, one stone at a time: cabin, CanvasCamp, orchard, pond, forest,
            and a family legacy system that can scale.
          </p>
          <div className="hero-actions">
            <ExploreButton />
            <a className="ghost-link" href={`${basePath}/dashboard/`}>
              Open planning cockpit
            </a>
          </div>
        </div>
      </section>

      <section className="section" id="vision">
        <div className="section-inner">
          <p className="section-kicker">The build philosophy</p>
          <h2 className="section-title">Pure assets, patiently made.</h2>
          <p className="section-copy">
            Chai & Cedar starts with the land: barn top-left, cabin top-right, CanvasCamp bottom-left, Viaan's
            treehouse-style play area bottom-right, and the north forest and pond protected as the emotional anchor.
            The work is to create revenue without losing the soul of the place.
          </p>
          <div className="belief-grid">
            {beliefs.map((belief) => (
              <div className="belief" key={belief.title}>
                <strong>{belief.title}</strong>
                <p>{belief.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="land-system">
        <div className="section-inner">
          <p className="section-kicker">Clickable property system</p>
          <h2 className="section-title">Every zone has a job, a plan, and a future version.</h2>
          <p className="section-copy">
            The public map is also the planning model. Each zone can hold build steps, media, cost assumptions,
            projected revenue, and AI-generated alternatives.
          </p>
          <div className="project-strip">
            {landSceneObjects
              .filter((object) => ["barn", "cabin", "tent", "play", "pond", "orchard"].includes(object.id))
              .map((object) => (
                <article className="project-tile" key={object.id}>
                  <strong>{object.title}</strong>
                  <p>{object.summary}</p>
                </article>
              ))}
          </div>
        </div>
      </section>

      <section className="section blueprint" id="blueprint">
        <div className="section-inner blueprint-grid">
          <div>
            <p className="section-kicker">Orchard and pond reference</p>
            <h2 className="section-title">The reference image becomes living data.</h2>
            <p className="section-copy">
              The orchard plan, pond visuals, sitout, and water ideas are stored as structured records so the
              website can evolve from vision board to operating blueprint.
            </p>
            <div className="blueprint-list">
              {orchardPlan.map((item) => (
                <div className="blueprint-item" key={item.zone}>
                  <strong>
                    {item.zone} / {item.season}
                  </strong>
                  <p>{item.items}</p>
                </div>
              ))}
            </div>
          </div>
          <div
            className="reference-image"
            role="img"
            aria-label="Chai and Cedar orchard reference plan"
            style={{ backgroundImage: `url("${basePath}/reference/chai-cedar-orchard-reference.png")` }}
          />
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <p className="section-kicker">Scale path</p>
          <h2 className="section-title">A retreat website now. A land value-add platform later.</h2>
          <p className="section-copy">
            The same system that tracks this property can become a client-facing product: upload land media, create
            3D scenarios, estimate phased improvements, and show owners how to add value without overbuilding.
          </p>
          <div className="belief-grid">
            {blueprintItems.map((item) => (
              <div className="belief" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
