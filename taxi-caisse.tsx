import { useState, useEffect } from "react";

const STORAGE_KEY = "taxi_courses";

const formatEuro = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

const today = () => new Date().toISOString().split("T")[0];

const initialForm = {
  heure: "",
  depart: "",
  arrivee: "",
  montant: "",
  paiement: "espèces",
  note: "",
};

export default function TaxiCaisse() {
  const [courses, setCourses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(initialForm);
  const [vue, setVue] = useState("dashboard"); // dashboard | ajouter | historique
  const [dateFiltre, setDateFiltre] = useState(today());
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  }, [courses]);

  const coursesJour = courses.filter((c) => c.date === dateFiltre);

  const totaux = coursesJour.reduce(
    (acc, c) => {
      acc.total += parseFloat(c.montant) || 0;
      if (c.paiement === "espèces") acc.especes += parseFloat(c.montant) || 0;
      else if (c.paiement === "carte") acc.carte += parseFloat(c.montant) || 0;
      else acc.autre += parseFloat(c.montant) || 0;
      return acc;
    },
    { total: 0, especes: 0, carte: 0, autre: 0 }
  );

  const ajouterCourse = () => {
    if (!form.montant || !form.heure) {
      setFlash({ type: "err", msg: "Heure et montant obligatoires." });
      return;
    }
    const nouvelle = { ...form, date: today(), id: Date.now() };
    setCourses([nouvelle, ...courses]);
    setForm(initialForm);
    setFlash({ type: "ok", msg: "Course ajoutée !" });
    setTimeout(() => setFlash(null), 2000);
    setVue("dashboard");
  };

  const supprimerCourse = (id) => {
    if (window.confirm("Supprimer cette course ?")) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const paiementColor = (p) =>
    p === "espèces" ? "#4ade80" : p === "carte" ? "#60a5fa" : "#facc15";

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>🚕</span>
          <div>
            <div style={styles.appName}>TaxiCaisse</div>
            <div style={styles.appSub}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
          </div>
        </div>
        <div style={styles.totalBadge}>{formatEuro(totaux.total)}</div>
      </header>

      {/* Flash */}
      {flash && (
        <div style={{ ...styles.flash, background: flash.type === "ok" ? "#166534" : "#7f1d1d" }}>
          {flash.msg}
        </div>
      )}

      {/* Navigation */}
      <nav style={styles.nav}>
        {[
          { id: "dashboard", label: "📊 Tableau de bord" },
          { id: "ajouter", label: "➕ Nouvelle course" },
          { id: "historique", label: "📋 Historique" },
        ].map((n) => (
          <button
            key={n.id}
            onClick={() => setVue(n.id)}
            style={{ ...styles.navBtn, ...(vue === n.id ? styles.navBtnActive : {}) }}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {/* DASHBOARD */}
        {vue === "dashboard" && (
          <div>
            <div style={styles.dateRow}>
              <span style={styles.sectionTitle}>Journée du</span>
              <input
                type="date"
                value={dateFiltre}
                onChange={(e) => setDateFiltre(e.target.value)}
                style={styles.dateInput}
              />
            </div>

            <div style={styles.cardsGrid}>
              <StatCard label="Total du jour" value={formatEuro(totaux.total)} icon="💰" accent="#fbbf24" />
              <StatCard label="Courses" value={coursesJour.length} icon="🚗" accent="#60a5fa" />
              <StatCard label="Espèces" value={formatEuro(totaux.especes)} icon="💵" accent="#4ade80" />
              <StatCard label="Carte" value={formatEuro(totaux.carte)} icon="💳" accent="#a78bfa" />
            </div>

            {/* Dernières courses du jour */}
            <div style={styles.sectionTitle}>Courses aujourd'hui</div>
            {coursesJour.length === 0 ? (
              <div style={styles.empty}>Aucune course pour cette journée.<br />Appuyez sur ➕ pour en ajouter une.</div>
            ) : (
              coursesJour.map((c) => (
                <CourseCard key={c.id} course={c} onDelete={supprimerCourse} paiementColor={paiementColor} />
              ))
            )}
          </div>
        )}

        {/* AJOUTER */}
        {vue === "ajouter" && (
          <div style={styles.formCard}>
            <div style={styles.formTitle}>Nouvelle course</div>

            <Label>Heure *</Label>
            <input
              type="time"
              value={form.heure}
              onChange={(e) => setForm({ ...form, heure: e.target.value })}
              style={styles.input}
            />

            <Label>Départ</Label>
            <input
              placeholder="ex: Gare du Nord"
              value={form.depart}
              onChange={(e) => setForm({ ...form, depart: e.target.value })}
              style={styles.input}
            />

            <Label>Arrivée</Label>
            <input
              placeholder="ex: Aéroport CDG"
              value={form.arrivee}
              onChange={(e) => setForm({ ...form, arrivee: e.target.value })}
              style={styles.input}
            />

            <Label>Montant (€) *</Label>
            <input
              type="number"
              step="0.10"
              min="0"
              placeholder="0.00"
              value={form.montant}
              onChange={(e) => setForm({ ...form, montant: e.target.value })}
              style={styles.input}
            />

            <Label>Paiement</Label>
            <div style={styles.paiementRow}>
              {["espèces", "carte", "autre"].map((p) => (
                <button
                  key={p}
                  onClick={() => setForm({ ...form, paiement: p })}
                  style={{
                    ...styles.paiementBtn,
                    background: form.paiement === p ? paiementColor(p) : "#1e293b",
                    color: form.paiement === p ? "#0f172a" : "#94a3b8",
                    fontWeight: form.paiement === p ? "700" : "400",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <Label>Note</Label>
            <input
              placeholder="Optionnel..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={styles.input}
            />

            <button onClick={ajouterCourse} style={styles.submitBtn}>
              Enregistrer la course
            </button>
            <button onClick={() => { setForm(initialForm); setVue("dashboard"); }} style={styles.cancelBtn}>
              Annuler
            </button>
          </div>
        )}

        {/* HISTORIQUE */}
        {vue === "historique" && (
          <div>
            <div style={styles.dateRow}>
              <span style={styles.sectionTitle}>Filtrer par date</span>
              <input
                type="date"
                value={dateFiltre}
                onChange={(e) => setDateFiltre(e.target.value)}
                style={styles.dateInput}
              />
            </div>

            <div style={styles.recapBox}>
              <div style={styles.recapItem}><span>Total</span><strong>{formatEuro(totaux.total)}</strong></div>
              <div style={styles.recapItem}><span>Espèces</span><strong style={{ color: "#4ade80" }}>{formatEuro(totaux.especes)}</strong></div>
              <div style={styles.recapItem}><span>Carte</span><strong style={{ color: "#60a5fa" }}>{formatEuro(totaux.carte)}</strong></div>
              <div style={styles.recapItem}><span>Autre</span><strong style={{ color: "#facc15" }}>{formatEuro(totaux.autre)}</strong></div>
            </div>

            {coursesJour.length === 0 ? (
              <div style={styles.empty}>Aucune course pour cette date.</div>
            ) : (
              coursesJour.map((c) => (
                <CourseCard key={c.id} course={c} onDelete={supprimerCourse} paiementColor={paiementColor} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${accent}` }}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={{ ...styles.statValue, color: accent }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function CourseCard({ course, onDelete, paiementColor }) {
  return (
    <div style={styles.courseCard}>
      <div style={styles.courseLeft}>
        <div style={styles.courseHeure}>{course.heure}</div>
        <div style={styles.courseRoute}>
          {course.depart && <span>{course.depart}</span>}
          {course.depart && course.arrivee && <span style={{ color: "#475569" }}> → </span>}
          {course.arrivee && <span>{course.arrivee}</span>}
          {!course.depart && !course.arrivee && <span style={{ color: "#475569" }}>Trajet non renseigné</span>}
        </div>
        {course.note && <div style={styles.courseNote}>{course.note}</div>}
      </div>
      <div style={styles.courseRight}>
        <div style={styles.courseMontant}>{parseFloat(course.montant).toFixed(2)} €</div>
        <div style={{ ...styles.coursePaiement, background: paiementColor(course.paiement) + "22", color: paiementColor(course.paiement) }}>
          {course.paiement}
        </div>
        <button onClick={() => onDelete(course.id)} style={styles.deleteBtn}>✕</button>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={styles.label}>{children}</div>;
}

const styles = {
  app: {
    background: "#0f172a",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    padding: "20px 20px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { fontSize: 32 },
  appName: { fontSize: 20, fontWeight: 800, color: "#fbbf24", letterSpacing: -0.5 },
  appSub: { fontSize: 12, color: "#64748b", textTransform: "capitalize" },
  totalBadge: {
    background: "#fbbf24",
    color: "#0f172a",
    fontWeight: 800,
    fontSize: 18,
    padding: "8px 14px",
    borderRadius: 12,
  },
  flash: {
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#fff",
    textAlign: "center",
  },
  nav: {
    display: "flex",
    gap: 4,
    padding: "12px 16px",
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
  },
  navBtn: {
    flex: 1,
    padding: "8px 4px",
    background: "transparent",
    border: "1px solid #1e293b",
    borderRadius: 10,
    color: "#64748b",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  navBtnActive: {
    background: "#1e293b",
    color: "#fbbf24",
    borderColor: "#fbbf24",
  },
  main: { padding: "16px" },
  dateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 },
  dateInput: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
    padding: "6px 10px",
    fontSize: 13,
  },
  cardsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  statCard: {
    background: "#1e293b",
    borderRadius: 14,
    padding: "14px 14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  empty: { color: "#475569", textAlign: "center", padding: "40px 20px", fontSize: 14, lineHeight: 1.8 },
  courseCard: {
    background: "#1e293b",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  courseLeft: { flex: 1 },
  courseHeure: { fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 2 },
  courseRoute: { fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 },
  courseNote: { fontSize: 12, color: "#64748b", marginTop: 2 },
  courseRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  courseMontant: { fontSize: 18, fontWeight: 800, color: "#fbbf24" },
  coursePaiement: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    fontSize: 12,
    padding: 2,
  },
  formCard: {
    background: "#1e293b",
    borderRadius: 16,
    padding: "20px",
  },
  formTitle: { fontSize: 18, fontWeight: 800, color: "#fbbf24", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  input: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#e2e8f0",
    padding: "10px 12px",
    fontSize: 15,
    marginBottom: 14,
    boxSizing: "border-box",
  },
  paiementRow: { display: "flex", gap: 8, marginBottom: 14 },
  paiementBtn: {
    flex: 1,
    padding: "10px 8px",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    cursor: "pointer",
    textTransform: "capitalize",
    transition: "all 0.15s",
  },
  submitBtn: {
    width: "100%",
    background: "#fbbf24",
    color: "#0f172a",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 10,
  },
  cancelBtn: {
    width: "100%",
    background: "transparent",
    color: "#64748b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "12px",
    fontSize: 14,
    cursor: "pointer",
  },
  recapBox: {
    background: "#0f172a",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  recapItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    color: "#94a3b8",
  },
};
