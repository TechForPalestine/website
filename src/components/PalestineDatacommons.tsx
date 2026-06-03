import { useState, useRef } from "react";
import type { CSSProperties } from "react";

const DATASETS = [
  {
    id: 1,
    name: "T4P Daily Casualties",
    org: "Tech for Palestine",
    category: "casualties",
    categoryLabel: "Casualties",
    formats: ["JSON", "CSV"],
    updateFreq: "Daily",
    access: "open",
    accessLabel: "REST API",
    license: "MIT",
    licenseType: "open",
    score: 5,
    records: "941+ daily reports",
    timespan: "Oct 2023 — present",
    url: "data.techforpalestine.org",
    description: "Daily reports on killed, injured, and demographic breakdowns from the Gaza Ministry of Health. Includes named individual lists, journalist deaths, and West Bank daily counts.",
    maintainer: "Tech for Palestine open-source community",
    size: "941+ daily records, 40k+ named individuals",
    accessDetail: "Static CDN API with versioned JSON/CSV endpoints. No auth required. GitHub repo available for historical tracking.",
    licenseDetail: "MIT licence on code. Data sourced from Gaza MoH (public domain). Free for all uses including commercial.",
    crossRefs: [2, 3, 6, 7],
    crossRefNotes: "Links to UNOSAT damage data on the same time axis. Named records can cross-reference B'Tselem casualty lists. Infrastructure sub-dataset connects to HOT baseline.",
    integrationEffort: "~1 day",
    caveats: "Official counts are a confirmed floor — MoH excludes indirect deaths (malnutrition, medical collapse). T4P documents this explicitly.",
    tags: ["daily updates", "named individuals", "demographics", "press killed", "infrastructure"]
  },
  {
    id: 2,
    name: "UNOSAT Damage Assessments",
    org: "UNOSAT / UN-HABITAT",
    category: "satellite",
    categoryLabel: "Satellite / Infrastructure",
    formats: ["GDB", "SHP", "PDF"],
    updateFreq: "Per-snapshot",
    access: "open",
    accessLabel: "HDX download",
    license: "CC BY-IGO 3.0",
    licenseType: "cc",
    score: 5,
    records: "163k+ structures",
    timespan: "Oct 2023 — Apr 2025",
    url: "data.humdata.org",
    description: "Satellite imagery-based comprehensive assessments of structural destruction across the full Gaza Strip. Each release compares current imagery against pre-war baselines.",
    maintainer: "UNOSAT (UN Satellite Centre)",
    size: "163,778+ structures assessed across 5 governorates, 9+ snapshot releases",
    accessDetail: "Direct download from HDX. No registration for CSV-level data. GDB/SHP for GIS. Latest release: April 2025.",
    licenseDetail: "Creative Commons Attribution for Intergovernmental Organisations. Free to use with attribution.",
    crossRefs: [1, 3, 4, 7],
    crossRefNotes: "Damage polygons overlay T4P casualty location data and ACLED event coordinates. HOT OSM baseline provides the pre-war building inventory as denominator.",
    integrationEffort: "2–3 days",
    caveats: "Preliminary analyses not field-validated. Road network damage is a separate dataset. Static snapshots require manual update tracking.",
    tags: ["geospatial", "building damage", "satellite imagery", "governorate breakdown"]
  },
  {
    id: 3,
    name: "HOT OSM Buildings Baseline",
    org: "Humanitarian OpenStreetMap Team",
    category: "satellite",
    categoryLabel: "Satellite / Infrastructure",
    formats: ["GeoJSON", "SHP", "PBF"],
    updateFreq: "Static",
    access: "open",
    accessLabel: "Direct download",
    license: "ODbL 1.0",
    licenseType: "open",
    score: 4,
    records: "All buildings (pre-war)",
    timespan: "Baseline: 2019–2023",
    url: "data.humdata.org",
    description: "Complete digitised inventory of every building footprint in Gaza before October 7, 2023. Essential denominator for calculating percentage of structures destroyed.",
    maintainer: "Humanitarian OpenStreetMap Team (global volunteers)",
    size: "Full pre-war building footprints, digitized from 2019–2023 imagery",
    accessDetail: "Direct download from HDX. No registration. Multiple formats including GeoJSON for web use.",
    licenseDetail: "Open Database Licence — full open use, derivative databases must share-alike.",
    crossRefs: [2],
    crossRefNotes: "Pairs with every UNOSAT release as the 'before' baseline. Enables % destroyed and per-neighbourhood analysis.",
    integrationEffort: "~1 day",
    caveats: "One-time snapshot — will not update. Intended as pre-war baseline only.",
    tags: ["geospatial", "building footprints", "pre-war baseline", "OSM"]
  },
  {
    id: 4,
    name: "ACLED Conflict Events",
    org: "ACLED",
    category: "events",
    categoryLabel: "Conflict Events",
    formats: ["CSV", "JSON", "API"],
    updateFreq: "Weekly",
    access: "restricted",
    accessLabel: "Registration required",
    license: "Custom EULA",
    licenseType: "restrictive",
    score: 4,
    records: "Event-level data",
    timespan: "Oct 2023 — present",
    url: "acleddata.com",
    description: "Disaggregated political violence and protest events with actor, date, location, fatality counts, and event type. Weekly updates. Aggregated version freely available on HDX.",
    maintainer: "ACLED (non-profit, operationally independent)",
    size: "Event-level: actor, date, location, fatalities for all political violence in oPt",
    accessDetail: "Aggregated CSV free on HDX. Full event data requires myACLED account (free registration). Higher tiers may require fees.",
    licenseDetail: "Proprietary EULA. Cannot redistribute raw data. Cannot build a 'functional substitute'. Transformative use permitted with attribution.",
    crossRefs: [1, 2, 5],
    crossRefNotes: "Event coordinates link to UNOSAT damage polygons. Actor breakdown enables civilian vs. combatant analysis cross-referencing T4P demographic data.",
    integrationEffort: "2 days",
    caveats: "EULA prohibits building competing platforms. Needs legal review before deep integration. Aggregated HDX version is the legally safe fallback.",
    tags: ["event-level", "political violence", "actor data", "weekly updates", "geospatial"]
  },
  {
    id: 5,
    name: "OCHA Humanitarian Situation",
    org: "UN OCHA",
    category: "humanitarian",
    categoryLabel: "Humanitarian",
    formats: ["CSV", "API", "PDF"],
    updateFreq: "Weekly",
    access: "open",
    accessLabel: "HDX HAPI",
    license: "CC BY-IGO",
    licenseType: "cc",
    score: 4,
    records: "325+ reports",
    timespan: "Oct 2023 — present",
    url: "data.humdata.org",
    description: "Comprehensive humanitarian indicators: displacement, food security, health system status, aid flows, and protection. Weekly situation reports plus structured API indicators.",
    maintainer: "UN OCHA",
    size: "325+ weekly reports, structured indicators across multiple sectors",
    accessDetail: "HDX HAPI REST API for structured indicators (no auth). PDFs for narrative reports. FTS API for financial tracking.",
    licenseDetail: "Creative Commons Attribution for Intergovernmental Organisations. Attribution required; otherwise fully open.",
    crossRefs: [1, 4],
    crossRefNotes: "IDP figures link to UNOSAT damage areas. Food security phases cross-reference casualty timeline. Aid flows connect to infrastructure destruction.",
    integrationEffort: "3–4 days",
    caveats: "IDP data for Palestine listed as 'unavailable' in 2025 HDX report. Food security and health indicators more complete. PDF reports need parsing.",
    tags: ["displacement", "food security", "health", "aid flows", "IPC phases"]
  },
  {
    id: 6,
    name: "B'Tselem Fatalities Database",
    org: "B'Tselem",
    category: "human-rights",
    categoryLabel: "Human Rights",
    formats: ["Web", "XLS"],
    updateFreq: "Irregular",
    access: "restricted",
    accessLabel: "Scraping required",
    license: "All rights reserved",
    licenseType: "restrictive",
    score: 3,
    records: "Individual verified fatalities",
    timespan: "2000 — present",
    url: "btselem.org/statistics",
    description: "Individually verified fatalities with age, sex, and circumstance — the only continuous record going back to the Second Intifada. Essential historical baseline.",
    maintainer: "B'Tselem (Israeli NGO, Jerusalem-based)",
    size: "Verified individual fatalities 2000–present, age/sex breakdown",
    accessDetail: "No API. Data in web tables. Excel export for some sub-datasets. Scraping or manual download required.",
    licenseDetail: "No open licence declared. All rights reserved. Academic papers cite freely under fair use. Redistribution unclear.",
    crossRefs: [1],
    crossRefNotes: "Only continuous casualty record from 2000–2022. Used as prior in Bayesian mortality models. Cross-references T4P for post-Oct 2023 data.",
    integrationEffort: "3–5 days",
    caveats: "Most valuable for historical context pre-Oct 2023. No API makes automated refresh unreliable. Direct contact with B'Tselem recommended for licence terms.",
    tags: ["historical", "verified individuals", "human rights", "long-term baseline"]
  },
  {
    id: 7,
    name: "Insecurity Insight — Attacks on Health",
    org: "Insecurity Insight / SHCC",
    category: "human-rights",
    categoryLabel: "Human Rights",
    formats: ["CSV", "XLS"],
    updateFreq: "Monthly",
    access: "open",
    accessLabel: "HDX download",
    license: "CC BY 4.0",
    licenseType: "cc",
    score: 3,
    records: "Event-level attacks",
    timespan: "2016 — present",
    url: "data.humdata.org",
    description: "Attacks on health care, education, food security, and aid operations. Documents IHL violations against protected persons and facilities.",
    maintainer: "Insecurity Insight (Swiss NGO) / SHCC",
    size: "Event-level: attacks on health, education, food security, aid · 2016–Apr 2025",
    accessDetail: "Direct download from HDX. No registration. CSV/XLS. Contact for curated extracts.",
    licenseDetail: "CC BY 4.0 — most permissive standard licence. Attribution required, full redistribution allowed.",
    crossRefs: [1, 2],
    crossRefNotes: "Health facility attacks link to UNOSAT damage polygons. Cross-references T4P aid-worker killed data.",
    integrationEffort: "~1 day",
    caveats: "Covers all oPt — filter required for Gaza Strip. Updates lag ~1 month. Most valuable for IHL violation documentation.",
    tags: ["health care attacks", "education", "IHL violations", "aid workers"]
  },
  {
    id: 8,
    name: "PCBS Population Statistics",
    org: "Palestinian Central Bureau of Statistics",
    category: "population",
    categoryLabel: "Population",
    formats: ["XLS", "PDF", "Web"],
    updateFreq: "Annual",
    access: "restricted",
    accessLabel: "Manual download",
    license: "Public domain (implicit)",
    licenseType: "open",
    score: 3,
    records: "Population by governorate",
    timespan: "Annual series",
    url: "pcbs.gov.ps",
    description: "Official Palestinian population counts by governorate, civil registration, and wartime demographic estimates. The authoritative denominator for per-capita calculations.",
    maintainer: "Palestinian Central Bureau of Statistics (PA)",
    size: "Annual population by governorate, civil registration, wartime estimates 2023–2024",
    accessDetail: "XLS and PDF downloads. No API. Some education indicators mirrored on UNESCO/HDX.",
    licenseDetail: "Published for public use; no explicit open licence. Treated as public domain by academic and UN users.",
    crossRefs: [1, 5],
    crossRefNotes: "Provides per-capita denominators for casualty rates, displacement ratios, and impact calculations. Used in all Lancet mortality studies.",
    integrationEffort: "~1 day",
    caveats: "End-2024 estimate: 2.1M in Gaza, down ~160k from 2023. CIA Factbook figure (2.14M) is a pre-war projection — PCBS is the correct source.",
    tags: ["demographics", "population", "denominators", "civil registration"]
  }
];

const CATEGORIES = {
  casualties: { color: "#C4503D", bg: "#FDF0ED", label: "Casualties" },
  satellite: { color: "#2D6A9F", bg: "#EBF2F9", label: "Satellite / Infrastructure" },
  events: { color: "#6B52AE", bg: "#F0EDF8", label: "Conflict Events" },
  humanitarian: { color: "#2E7D5B", bg: "#EDF6F1", label: "Humanitarian" },
  "human-rights": { color: "#9E4D6B", bg: "#F6EDF1", label: "Human Rights" },
  population: { color: "#A07628", bg: "#F8F3E8", label: "Population" },
};

const ACCESS_STYLES = {
  open: { dot: "#2E7D5B", label: "Open" },
  restricted: { dot: "#C4503D", label: "Restricted" },
};

const LICENSE_STYLES = {
  open: { color: "#2E7D5B" },
  cc: { color: "#2D6A9F" },
  restrictive: { color: "#C4503D" },
};

function StarRating({ n }) {
  return (
    <span style={{ letterSpacing: "-1px", fontSize: 14 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= n ? "#B8860B" : "#D4D0C8" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function FormatPill({ fmt }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10,
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        padding: "2px 6px",
        background: "rgba(120,120,110,0.08)",
        borderRadius: 3,
        color: "var(--ds-text-secondary)",
        marginRight: 3,
        marginBottom: 2,
      }}
    >
      {fmt}
    </span>
  );
}

function CategoryBadge({ cat, small }) {
  const c = CATEGORIES[cat];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: small ? 10 : 11,
        fontWeight: 500,
        color: c.color,
        background: c.bg,
        padding: small ? "2px 8px" : "3px 10px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.color,
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  );
}

function AccessDot({ type }) {
  const s = ACCESS_STYLES[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      <span style={{ color: "var(--ds-text-secondary)" }}>{s.label}</span>
    </span>
  );
}

function ConnectionLine({ from, to, datasets }) {
  const a = datasets.find((d) => d.id === from);
  const b = datasets.find((d) => d.id === to);
  if (!a || !b) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        color: "var(--ds-text-secondary)",
        padding: "4px 0",
      }}
    >
      <span
        style={{
          fontWeight: 500,
          color: CATEGORIES[a.category].color,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: "0 1 auto",
        }}
      >
        {a.name}
      </span>
      <span style={{ flex: "0 0 auto", opacity: 0.4, fontSize: 16 }}>↔</span>
      <span
        style={{
          fontWeight: 500,
          color: CATEGORIES[b.category].color,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: "0 1 auto",
        }}
      >
        {b.name}
      </span>
    </div>
  );
}

function DatasetCard({ dataset, isSelected, onClick, index }) {
  const cat = CATEGORIES[dataset.category];
  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? cat.bg : "var(--ds-bg-primary)",
        border: isSelected
          ? `1.5px solid ${cat.color}`
          : "1px solid var(--ds-border)",
        borderRadius: 10,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        opacity: 0,
        animation: `fadeSlideIn 0.35s ease ${index * 0.04}s forwards`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 3,
          height: "100%",
          background: cat.color,
          borderRadius: "10px 0 0 10px",
          opacity: isSelected ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--ds-text-primary)",
              marginBottom: 2,
              lineHeight: 1.3,
            }}
          >
            {dataset.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--ds-text-secondary)" }}>
            {dataset.org}
          </div>
        </div>
        <StarRating n={dataset.score} />
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--ds-text-secondary)",
          lineHeight: 1.55,
          margin: "8px 0 12px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {dataset.description}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <CategoryBadge cat={dataset.category} small />
        <AccessDot type={dataset.access} />
        <span style={{ fontSize: 10, color: "var(--ds-text-tertiary)" }}>
          {dataset.updateFreq}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {dataset.formats.map((f) => (
          <FormatPill key={f} fmt={f} />
        ))}
        {dataset.crossRefs.length > 0 && (
          <span
            style={{
              fontSize: 10,
              color: "var(--ds-text-tertiary)",
              marginLeft: 6,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            ↔ {dataset.crossRefs.length} connections
          </span>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ dataset, onClose }) {
  const cat = CATEGORIES[dataset.category];
  const lic = LICENSE_STYLES[dataset.licenseType];
  const sections = [
    { label: "Maintainer", value: dataset.maintainer },
    { label: "Coverage & size", value: dataset.size },
    { label: "Time span", value: dataset.timespan },
    { label: "Access method", value: dataset.accessDetail },
    { label: "License", value: dataset.licenseDetail, color: lic.color },
    { label: "Integration effort", value: dataset.integrationEffort },
  ];

  return (
    <div
      style={{
        background: "var(--ds-bg-primary)",
        borderLeft: `3px solid ${cat.color}`,
        borderRadius: "0 12px 12px 0",
        padding: "24px 22px 28px",
        animation: "slideIn 0.25s ease",
        overflowY: "auto",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <CategoryBadge cat={dataset.category} />
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "var(--ds-text-primary)",
              marginTop: 10,
              lineHeight: 1.25,
              fontFamily: "'Source Serif 4', Georgia, serif",
            }}
          >
            {dataset.name}
          </h2>
          <div
            style={{
              fontSize: 12,
              color: "var(--ds-text-secondary)",
              marginTop: 4,
            }}
          >
            {dataset.org}
            <span style={{ margin: "0 6px", opacity: 0.3 }}>·</span>
            <a
              href={`https://${dataset.url}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: cat.color,
                textDecoration: "none",
                borderBottom: `1px solid ${cat.color}33`,
              }}
            >
              {dataset.url}
            </a>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            color: "var(--ds-text-tertiary)",
            cursor: "pointer",
            padding: "0 0 0 8px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: "var(--ds-text-secondary)",
          marginBottom: 20,
          borderBottom: "1px solid var(--ds-border)",
          paddingBottom: 16,
        }}
      >
        {dataset.description}
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {dataset.formats.map((f) => (
          <FormatPill key={f} fmt={f} />
        ))}
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            background: ACCESS_STYLES[dataset.access].dot + "15",
            color: ACCESS_STYLES[dataset.access].dot,
            borderRadius: 20,
            fontWeight: 500,
          }}
        >
          {dataset.accessLabel}
        </span>
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            background: lic.color + "15",
            color: lic.color,
            borderRadius: 20,
            fontWeight: 500,
          }}
        >
          {dataset.license}
        </span>
      </div>

      {sections.map((s, i) => (
        <div
          key={i}
          style={{
            marginBottom: 14,
            paddingBottom: 14,
            borderBottom: i < sections.length - 1 ? "1px solid var(--ds-border-light)" : "none",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--ds-text-tertiary)",
              marginBottom: 4,
            }}
          >
            {s.label}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: s.color || "var(--ds-text-primary)" }}>
            {s.value}
          </div>
        </div>
      ))}

      <div
        style={{
          background: cat.bg,
          borderRadius: 8,
          padding: "14px 16px",
          marginTop: 6,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: cat.color,
            marginBottom: 8,
          }}
        >
          Cross-reference connections
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--ds-text-primary)", marginBottom: 10 }}>
          {dataset.crossRefNotes}
        </div>
        {dataset.crossRefs.map((refId) => {
          const ref = DATASETS.find((d) => d.id === refId);
          if (!ref) return null;
          const rc = CATEGORIES[ref.category];
          return (
            <div
              key={refId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 500,
                color: rc.color,
                background: "var(--ds-bg-primary)",
                padding: "4px 10px",
                borderRadius: 20,
                marginRight: 6,
                marginBottom: 4,
                border: `1px solid ${rc.color}30`,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: rc.color }} />
              {ref.name}
            </div>
          );
        })}
      </div>

      {dataset.caveats && (
        <div
          style={{
            background: "#FDF8ED",
            border: "1px solid #E8D9B0",
            borderRadius: 8,
            padding: "12px 14px",
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#8B6914",
              marginBottom: 4,
            }}
          >
            Caveats
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: "#6B5210", margin: 0 }}>
            {dataset.caveats}
          </p>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {dataset.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              color: "var(--ds-text-tertiary)",
              background: "var(--ds-bg-secondary)",
              padding: "3px 8px",
              borderRadius: 20,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function NetworkGraph({ datasets, selectedId, onSelect }) {
  const svgRef = useRef(null);
  const positions = [
    { x: 160, y: 50 },
    { x: 310, y: 30 },
    { x: 440, y: 65 },
    { x: 90, y: 150 },
    { x: 260, y: 155 },
    { x: 410, y: 155 },
    { x: 520, y: 120 },
    { x: 180, y: 230 },
  ];
  const edges = [];
  datasets.forEach((d) => {
    d.crossRefs.forEach((refId) => {
      if (
        d.id < refId &&
        !edges.find((e) => e.from === d.id && e.to === refId)
      ) {
        edges.push({ from: d.id, to: refId });
      }
    });
  });

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 600 270"
      style={{ width: "100%", height: "auto" }}
    >
      {edges.map((e, i) => {
        const fromPos = positions[e.from - 1];
        const toPos = positions[e.to - 1];
        const isHighlighted =
          selectedId && (e.from === selectedId || e.to === selectedId);
        return (
          <line
            key={i}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={isHighlighted ? CATEGORIES[datasets.find((d) => d.id === selectedId).category].color : "#C4C0B8"}
            strokeWidth={isHighlighted ? 1.5 : 0.5}
            strokeDasharray={isHighlighted ? "none" : "3 3"}
            opacity={selectedId ? (isHighlighted ? 0.8 : 0.15) : 0.4}
            style={{ transition: "all 0.3s" }}
          />
        );
      })}
      {datasets.map((d, i) => {
        const pos = positions[i];
        const cat = CATEGORIES[d.category];
        const isSelected = selectedId === d.id;
        const isConnected =
          selectedId &&
          (datasets
            .find((ds) => ds.id === selectedId)
            ?.crossRefs.includes(d.id) ||
            d.id === selectedId);
        const dimmed = selectedId && !isConnected;
        return (
          <g
            key={d.id}
            onClick={() => onSelect(d.id)}
            style={{ cursor: "pointer", transition: "opacity 0.3s" }}
            opacity={dimmed ? 0.2 : 1}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 22 : 18}
              fill={isSelected ? cat.color : cat.bg}
              stroke={cat.color}
              strokeWidth={isSelected ? 2 : 1}
              style={{ transition: "all 0.25s" }}
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={isSelected ? 10 : 9}
              fontWeight={600}
              fill={isSelected ? "#fff" : cat.color}
              style={{ pointerEvents: "none", transition: "all 0.25s" }}
            >
              {d.id}
            </text>
            <text
              x={pos.x}
              y={pos.y + 30}
              textAnchor="middle"
              fontSize={9}
              fill={dimmed ? "var(--ds-text-tertiary)" : "var(--ds-text-secondary)"}
              fontWeight={500}
              style={{ pointerEvents: "none" }}
            >
              {d.name.length > 22 ? d.name.substring(0, 20) + "…" : d.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function PalestineDatacommons() {
  const [selectedId, setSelectedId] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("grid");

  const filtered = DATASETS.filter((d) => {
    const matchCat = filterCat === "all" || d.category === filterCat;
    const matchSearch =
      searchTerm === "" ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.org.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  const selectedDataset = DATASETS.find((d) => d.id === selectedId);
  const categories = ["all", ...Object.keys(CATEGORIES)];

  const cssVars: Record<string, string> = {
    "--ds-bg-primary": "#FAFAF7",
    "--ds-bg-secondary": "#F0EFEB",
    "--ds-bg-tertiary": "#E8E6E0",
    "--ds-text-primary": "#1A1A18",
    "--ds-text-secondary": "#6B6960",
    "--ds-text-tertiary": "#9E9B90",
    "--ds-border": "#DDD9D0",
    "--ds-border-light": "#EAE8E2",
  };

  return (
    <div
      style={{
        ...cssVars,
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        background: "var(--ds-bg-primary)",
        color: "var(--ds-text-primary)",
      } as CSSProperties}
    >
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <header
        style={{
          padding: "28px 32px 20px",
          borderBottom: "1px solid var(--ds-border)",
          background: "linear-gradient(180deg, #F5F4F0 0%, var(--ds-bg-primary) 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'Source Serif 4', Georgia, serif",
              letterSpacing: "-0.02em",
              color: "var(--ds-text-primary)",
            }}
          >
            Palestine Datacommons
          </h1>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--ds-text-tertiary)",
              background: "var(--ds-bg-secondary)",
              padding: "3px 8px",
              borderRadius: 4,
            }}
          >
            Dataset catalog
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--ds-text-secondary)",
            lineHeight: 1.5,
            maxWidth: 600,
            marginBottom: 18,
          }}
        >
          Discover, explore, and cross-reference independent datasets documenting
          the conflict in Gaza. A single entry point for data that was previously
          siloed across separate projects.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 320 }}>
            <input
              type="text"
              placeholder="Search datasets, tags, organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                border: "1px solid var(--ds-border)",
                borderRadius: 8,
                fontSize: 12,
                background: "var(--ds-bg-primary)",
                color: "var(--ds-text-primary)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: "var(--ds-text-tertiary)",
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
          </div>

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {categories.map((c) => {
              const isActive = filterCat === c;
              const catData = c === "all" ? null : CATEGORIES[c];
              return (
                <button
                  key={c}
                  onClick={() => { setFilterCat(c); setSelectedId(null); }}
                  style={{
                    fontSize: 11,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: isActive
                      ? `1px solid ${catData?.color || "#8B8880"}`
                      : "1px solid var(--ds-border)",
                    background: isActive
                      ? catData?.bg || "var(--ds-bg-secondary)"
                      : "transparent",
                    color: isActive
                      ? catData?.color || "var(--ds-text-primary)"
                      : "var(--ds-text-secondary)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: isActive ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {c === "all" ? `All (${DATASETS.length})` : catData.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              border: "1px solid var(--ds-border)",
              borderRadius: 6,
              overflow: "hidden",
              marginLeft: "auto",
            }}
          >
            {["grid", "network"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  border: "none",
                  background: view === v ? "var(--ds-bg-secondary)" : "transparent",
                  color: view === v ? "var(--ds-text-primary)" : "var(--ds-text-tertiary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: view === v ? 600 : 400,
                }}
              >
                {v === "grid" ? "Catalog" : "Connections"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          gap: 0,
          padding: view === "network" ? "20px 32px" : 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {view === "network" && (
            <div
              style={{
                background: "var(--ds-bg-primary)",
                border: "1px solid var(--ds-border)",
                borderRadius: 12,
                padding: "16px 20px 8px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ds-text-secondary)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Cross-reference network
              </div>
              <NetworkGraph
                datasets={DATASETS}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
              />
              <p
                style={{
                  fontSize: 10,
                  color: "var(--ds-text-tertiary)",
                  textAlign: "center",
                  paddingBottom: 4,
                }}
              >
                Click a node to highlight connections · Lines show datasets that
                can be joined or cross-referenced
              </p>
            </div>
          )}

          {view === "grid" && (
            <div
              style={{
                display: "flex",
                minHeight: "calc(100vh - 180px)",
              }}
            >
              <div
                style={{
                  flex: selectedId ? "0 0 55%" : "1 1 100%",
                  padding: "20px 24px 32px 32px",
                  transition: "flex 0.3s ease",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--ds-text-secondary)" }}>
                    {filtered.length} dataset{filtered.length !== 1 && "s"}
                    {filterCat !== "all" && ` in ${CATEGORIES[filterCat].label}`}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--ds-text-tertiary)" }}>
                    Sorted by priority score
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: selectedId
                      ? "1fr"
                      : "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 12,
                  }}
                >
                  {filtered
                    .sort((a, b) => b.score - a.score)
                    .map((d, i) => (
                      <DatasetCard
                        key={d.id}
                        dataset={d}
                        index={i}
                        isSelected={selectedId === d.id}
                        onClick={() =>
                          setSelectedId(d.id === selectedId ? null : d.id)
                        }
                      />
                    ))}
                </div>

                {filtered.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "var(--ds-text-tertiary)",
                      fontSize: 13,
                    }}
                  >
                    No datasets match your filters.
                  </div>
                )}
              </div>

              {selectedId && selectedDataset && (
                <div
                  style={{
                    flex: "0 0 45%",
                    borderLeft: "1px solid var(--ds-border)",
                    overflowY: "auto",
                    maxHeight: "calc(100vh - 180px)",
                  }}
                >
                  <DetailPanel
                    dataset={selectedDataset}
                    onClose={() => setSelectedId(null)}
                  />
                </div>
              )}
            </div>
          )}

          {view === "network" && selectedId && selectedDataset && (
            <div
              style={{
                border: "1px solid var(--ds-border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <DetailPanel
                dataset={selectedDataset}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "16px 32px",
          borderTop: "1px solid var(--ds-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { n: DATASETS.length, l: "datasets catalogued" },
            { n: DATASETS.filter((d) => d.access === "open").length, l: "fully open access" },
            { n: DATASETS.filter((d) => ["Daily", "Weekly"].includes(d.updateFreq)).length, l: "live / weekly updates" },
            {
              n: new Set(
                DATASETS.flatMap((d) => d.crossRefs).concat(
                  DATASETS.filter((d) => d.crossRefs.length > 0).map((d) => d.id)
                )
              ).size,
              l: "cross-linked datasets",
            },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ds-text-primary)" }}>
                {s.n}
              </span>
              <span style={{ fontSize: 11, color: "var(--ds-text-tertiary)" }}>
                {s.l}
              </span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 10, color: "var(--ds-text-tertiary)" }}>
          Palestine Datacommons · Dataset catalog
        </span>
      </div>
    </div>
  );
}
