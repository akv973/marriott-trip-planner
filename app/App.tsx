import { BrandMark } from '../components/BrandMark';
import { ContourArt } from '../components/ContourArt';
import { FoundationError } from '../components/FoundationError';
import { loadFoundation } from '../lib/catalog/foundation';
import type { FoundationManifest } from '../types/foundation';

function FoundationScreen({ manifest }: { manifest: FoundationManifest }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#overview" aria-label="Marriott Trip Planner overview">
          <BrandMark />
          <span>Marriott<span className="brand-subtitle">Trip Planner</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#overview">Overview</a>
          <a href="#foundation">Our approach</a>
          <a href="#roadmap">What’s next</a>
        </nav>
        <span className="stage-pill"><span />Foundation · Stage {manifest.stage}</span>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="overview" className="hero" aria-labelledby="hero-title">
          <ContourArt />
          <div className="hero-copy">
            <p className="eyebrow">Thoughtful stays. Clear decisions.</p>
            <h1 id="hero-title">Your next journey,<br /><em>well considered.</em></h1>
            <p className="hero-description">A place to discover worthwhile Marriott stays, make sense of cash and points, and bring your travel plans together.</p>
            <a className="primary-link" href="#roadmap">Explore what’s coming <span aria-hidden="true">↗</span></a>
          </div>
          <div className="hero-note"><span className="note-line" />The first step: a foundation you can trust.</div>
        </section>

        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div><p className="eyebrow">Your property collection</p><h2 id="catalog-title">Great trips start with great stays.</h2></div>
            <span className="quiet-label">Catalog not yet populated</span>
          </div>
          <div className="empty-catalog">
            <span className="empty-icon" aria-hidden="true">⌑</span>
            <div><h3>A considered collection is on the way.</h3><p>Hotels will appear here as their details are researched and sourced. This foundation contains no property listings or pricing.</p></div>
            <span className="empty-count">0<span>curated properties</span></span>
          </div>
        </section>

        <section id="foundation" className="principles-section" aria-labelledby="principles-title">
          <div className="principles-intro"><p className="eyebrow">Built with care</p><h2 id="principles-title">Better planning begins<br />with better information.</h2><p>Useful decisions need reliable facts and visible assumptions. That is the starting point for every part of this planner.</p></div>
          <div className="principle-list">
            <article><span>01</span><div><h3>Evidence before recommendations</h3><p>Important hotel facts will carry their sources. Unknown information will stay unknown.</p></div></article>
            <article><span>02</span><div><h3>Your rates, transparent value</h3><p>Enter the cash and award prices you find. See the assumptions behind a booking assessment.</p></div></article>
            <article><span>03</span><div><h3>Plans that stay yours</h3><p>Profiles and trips are designed for local browser storage, with export and import planned.</p></div></article>
          </div>
        </section>

        <section id="roadmap" className="roadmap-section" aria-labelledby="roadmap-title">
          <div className="section-heading"><div><p className="eyebrow">A clear path forward</p><h2 id="roadmap-title">Taking shape, one stage at a time.</h2></div><span className="quiet-label">Planned capabilities</span></div>
          <div className="roadmap-grid">
            {manifest.modules.map((module, index) => (
              <article className="roadmap-card" key={module.id}>
                <div className="card-top"><span className="card-number">0{index + 1}</span><span className="card-stage">Stage {module.firstStage}</span></div>
                <h3>{module.title}</h3><p>{module.description}</p><span className="planned-label">Planned</span>
              </article>
            ))}
          </div>
          <p className="roadmap-note">Next milestone: the data and evidence model. Each stage is reviewed before the next begins.</p>
        </section>
      </main>

      <footer><p>Marriott Trip Planner <span>·</span> Thoughtful travel, explained.</p><p>Independent planning tool. Not affiliated with Marriott International.</p></footer>
    </>
  );
}

export function App() {
  const result = loadFoundation();
  return result.success ? <FoundationScreen manifest={result.data.foundation} /> : <FoundationError />;
}
