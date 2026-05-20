import { useState, useEffect, useRef, useCallback } from "react";

// ─── QR CODE LIBRARY (via canvas) ─────────────────────────────────────────────
// We'll use a simple QR generation approach with the qrcode.js-like logic
// loaded dynamically, or generate a data URL using an API

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const today = () => new Date().toISOString().slice(0,10);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("de-DE") : "–";
const calcTier = (pts) => pts >= 300 ? "gold" : pts >= 100 ? "silver" : "bronze";

const TIER_CONFIG = {
  bronze: { label: "Bronze", color: "#b45309" },
  silver: { label: "Silber", color: "#6b7280" },
  gold:   { label: "Gold",   color: "#b45309" },
};

const ADMIN_CRED = { username: "admin", password: "admin" };

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_SETTINGS = {
  shopName: "Café Aura",
  euroPerPoint: 1.0,
  pointsPerStamp: 10,
  stampCardSize: 10,
  stampCardMode: "loop",
  rewards: [
    { id: "r1", stamps: 5, name: "Gratis Kaffee", icon: "fa-solid fa-mug-hot", description: "Ein Heißgetränk", keepAfterRedeem: false, pointsOnRedeem: 0 },
    { id: "r2", stamps: 10, name: "10% Rabatt", icon: "fa-solid fa-tag", description: "Auf den gesamten Einkauf", keepAfterRedeem: false, pointsOnRedeem: 0 },
  ],
  coupons: [
    { id: "cp1", code: "SOMMER24", discount: "15%", validUntil: "2025-12-31", active: true, usageCount: 0, maxUsage: 100, keepAfterRedeem: false, pointsOnRedeem: 50 },
  ],
};

const INIT_CUSTOMERS = [
  { id: "c1", username: "Max Mustermann", password: "welcome123", firstLogin: false, name: "Max Mustermann", birthdate: "1990-05-12", email: "max@email.de", phone: "+49 170 1234567", points: 340, stamps: 7, memberSince: "2024-01-15", tier: "gold", language: "de", darkMode: true, collectedBonuses: [], redeemedCoupons: [], hiddenFromQR: [], history: [{ id: genId(), date: "2024-06-01", type: "earn", amount: 50, desc: "Einkauf 50€", emp: "Sophie" }, { id: genId(), date: "2024-06-10", type: "redeem", amount: -20, desc: "Punkte eingelöst", emp: "Tom" }] },
  { id: "c2", username: "Anna Schmidt", password: "welcome123", firstLogin: false, name: "Anna Schmidt", birthdate: "1995-08-23", email: "anna@email.de", phone: "+49 151 9876543", points: 120, stamps: 3, memberSince: "2024-03-10", tier: "silver", language: "de", darkMode: true, collectedBonuses: [], redeemedCoupons: [], hiddenFromQR: [], history: [{ id: genId(), date: "2024-06-05", type: "earn", amount: 30, desc: "Einkauf 30€", emp: "Tom" }] },
];

const INIT_EMPLOYEES = [
  { id: "e1", name: "Sophie Braun", code: "EMP001", role: "Barista", email: "sophie@cafe.de", active: true, isAdmin: false, stats: { scans: 24, pointsGiven: 480, lastActive: "2024-06-10" } },
  { id: "e2", name: "Tom Fischer", code: "EMP002", role: "Kassier", email: "tom@cafe.de", active: true, isAdmin: false, stats: { scans: 18, pointsGiven: 320, lastActive: "2024-06-09" } },
];

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  de: {
    login: "Anmelden", username: "Benutzername", password: "Passwort",
    logout: "Abmelden", save: "Speichern", cancel: "Abbrechen",
    back: "Zurück", search: "Suchen...", noResults: "Keine Ergebnisse",
    points: "Punkte", stamps: "Stempel", history: "Verlauf",
    account: "Konto", settings: "Einstellungen", employees: "Team",
    customers: "Kunden", overview: "Übersicht", statistics: "Statistiken",
    rewards: "Belohnungen", coupons: "Coupons", scan: "Scannen",
    darkMode: "Dunkelmodus", language: "Sprache", shopName: "Shop-Name",
    memberSince: "Mitglied seit", addPoints: "Punkte vergeben",
    invalidCredentials: "Ungültige Anmeldedaten",
    welcomeBack: "Willkommen zurück",
    completeProfile: "Profil vervollständigen",
    fullName: "Vollständiger Name", birthdate: "Geburtsdatum",
    email: "E-Mail", phone: "Telefon (optional)",
    newPassword: "Neues Passwort", confirmPassword: "Passwort bestätigen",
    passwordMismatch: "Passwörter stimmen nicht überein",
    fillAllFields: "Bitte alle Pflichtfelder ausfüllen",
    tier: "Status", purchaseAmount: "Einkaufsbetrag",
    givePoints: "Punkte vergeben", done: "Fertig",
    close: "Schließen", active: "Aktiv", inactive: "Inaktiv",
    createAccount: "Konto erstellen", resetPassword: "Passwort zurücksetzen",
    newPassword2: "Neues Passwort", role: "Rolle",
    addEmployee: "Mitarbeiter hinzufügen", loginCode: "Login-Code",
    statsTitle: "Statistiken", totalPoints: "Gesamtpunkte",
    avgPoints: "Ø Punkte/Kunde", activeCustomers: "Aktive Kunden",
    totalStamps: "Stempel gesamt", transactions: "Transaktionen",
    redeemBonus: "Bonus einlösen", redeemCoupon: "Coupon einlösen",
    available: "Verfügbar", missing: "fehlen",
    addedToQR: "Zum QR hinzugefügt", removeFromQR: "Vom QR entfernen",
    keepAfterRedeem: "Nach Einlösung behalten", pointsOnRedeem: "Punkte beim Einlösen",
    maxUsage: "Max. Nutzungen", validUntil: "Gültig bis",
    discount: "Rabatt", newCoupon: "Neuer Coupon", newReward: "Neue Belohnung",
    description: "Beschreibung", stampPos: "Stempel-Position",
    saveSettings: "Einstellungen speichern", adminRole: "Admin-Rechte",
    employeeStats: "Mitarbeiter-Statistiken",
    qrCode: "QR-Code", myQRCode: "Mein QR-Code",
    pendingBonuses: "Offene Boni", pendingCoupons: "Offene Coupons",
    markRedeemed: "Als eingelöst markieren",
    preview: "Vorschau",
  },
  en: {
    login: "Sign in", username: "Username", password: "Password",
    logout: "Sign out", save: "Save", cancel: "Cancel",
    back: "Back", search: "Search...", noResults: "No results",
    points: "Points", stamps: "Stamps", history: "History",
    account: "Account", settings: "Settings", employees: "Team",
    customers: "Customers", overview: "Overview", statistics: "Statistics",
    rewards: "Rewards", coupons: "Coupons", scan: "Scan",
    darkMode: "Dark mode", language: "Language", shopName: "Shop name",
    memberSince: "Member since", addPoints: "Add points",
    invalidCredentials: "Invalid credentials",
    welcomeBack: "Welcome back",
    completeProfile: "Complete profile",
    fullName: "Full name", birthdate: "Date of birth",
    email: "E-mail", phone: "Phone (optional)",
    newPassword: "New password", confirmPassword: "Confirm password",
    passwordMismatch: "Passwords don't match",
    fillAllFields: "Please fill all required fields",
    tier: "Tier", purchaseAmount: "Purchase amount",
    givePoints: "Give points", done: "Done",
    close: "Close", active: "Active", inactive: "Inactive",
    createAccount: "Create account", resetPassword: "Reset password",
    newPassword2: "New password", role: "Role",
    addEmployee: "Add employee", loginCode: "Login code",
    statsTitle: "Statistics", totalPoints: "Total points",
    avgPoints: "Avg points/customer", activeCustomers: "Active customers",
    totalStamps: "Total stamps", transactions: "Transactions",
    redeemBonus: "Redeem bonus", redeemCoupon: "Redeem coupon",
    available: "Available", missing: "missing",
    addedToQR: "Added to QR", removeFromQR: "Remove from QR",
    keepAfterRedeem: "Keep after redeem", pointsOnRedeem: "Points on redeem",
    maxUsage: "Max usages", validUntil: "Valid until",
    discount: "Discount", newCoupon: "New coupon", newReward: "New reward",
    description: "Description", stampPos: "Stamp position",
    saveSettings: "Save settings", adminRole: "Admin rights",
    employeeStats: "Employee stats",
    qrCode: "QR Code", myQRCode: "My QR Code",
    pendingBonuses: "Pending bonuses", pendingCoupons: "Pending coupons",
    markRedeemed: "Mark as redeemed",
    preview: "Preview",
  },
};

// ─── QR CODE COMPONENT ────────────────────────────────────────────────────────
function QRCodeDisplay({ value, size = 140 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
      if (ref.current) {
        ref.current.innerHTML = "";
        try {
          new window.QRCode(ref.current, {
            text: value,
            width: size,
            height: size,
            colorDark: "#1a1a1a",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.M,
          });
        } catch(e) {
          ref.current.innerHTML = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:8px;font-size:11px;color:#6b7280;text-align:center;padding:8px">${value}</div>`;
        }
      }
    };
    script.onerror = () => {
      if (ref.current) ref.current.innerHTML = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#f3f4f6;border-radius:8px;font-size:12px;color:#6b7280;padding:8px;text-align:center">QR: ${value.slice(0,20)}</div>`;
    };
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, [value, size]);
  return <div ref={ref} style={{ display: "inline-block" }} />;
}

// ─── REAL QR SCANNER ─────────────────────────────────────────────────────────
function QRScannerCamera({ customers, settings, onScanned, onClose, t }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [cameraState, setCameraState] = useState("starting"); // starting | active | error
  const [cameraError, setCameraError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, []);

  const startCamera = async () => {
    const tries = [
      { video: { facingMode: { exact: "environment" } } },
      { video: { facingMode: "environment" } },
      { video: { facingMode: "user" } },
      { video: true },
    ];
    for (const constraint of tries) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraState("active");
          startScanning();
        }
        return;
      } catch (e) { continue; }
    }
    setCameraState("error");
    setCameraError("Kamerazugriff verweigert. Bitte Erlaubnis im Browser erteilen.");
  };

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      // Try BarcodeDetector if available
      if (window.BarcodeDetector) {
        const bd = new window.BarcodeDetector({ formats: ["qr_code"] });
        bd.detect(canvas).then(barcodes => {
          if (barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            handleQRValue(rawValue);
          }
        }).catch(() => {});
      }
    }, 500);
  };

  const handleQRValue = (raw) => {
    stopCamera();
    // Try to find customer by QR value (format: "LOYALTY_<customerId>")
    const match = raw.match(/^LOYALTY_(.+)$/);
    if (match) {
      const cust = customers.find(c => c.id === match[1]);
      if (cust) { onScanned(cust, "normal"); return; }
    }
    // Check bonus QR
    const bonusMatch = raw.match(/^BONUS_(.+)_(.+)$/);
    if (bonusMatch) {
      const cust = customers.find(c => c.id === bonusMatch[1]);
      if (cust) { onScanned(cust, "bonus", bonusMatch[2]); return; }
    }
    // Check coupon QR
    const couponMatch = raw.match(/^COUPON_(.+)_(.+)$/);
    if (couponMatch) {
      const cust = customers.find(c => c.id === couponMatch[1]);
      if (cust) { onScanned(cust, "coupon", couponMatch[2]); return; }
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "0 0 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>QR Scanner</div>
        <button onClick={() => { stopCamera(); onClose(); }} style={styles.iconBtn}><i className="fa-solid fa-xmark"></i></button>
      </div>

      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "#111", aspectRatio: "4/3" }}>
        {cameraState === "active" && (
          <>
            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} playsInline muted />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 180, height: 180, position: "relative" }}>
                {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
                  <div key={v+h} style={{ position: "absolute", [v]: 0, [h]: 0, width: 24, height: 24,
                    borderTop: v==="top" ? "3px solid #3b82f6" : "none",
                    borderBottom: v==="bottom" ? "3px solid #3b82f6" : "none",
                    borderLeft: h==="left" ? "3px solid #3b82f6" : "none",
                    borderRight: h==="right" ? "3px solid #3b82f6" : "none",
                  }} />
                ))}
              </div>
            </div>
          </>
        )}
        {cameraState === "starting" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af", fontSize: 13 }}>Kamera wird gestartet…</div>
        )}
        {cameraState === "error" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28 }}><i className="fa-solid fa-camera" style={{color:"#9ca3af"}}></i></div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{cameraError}</div>
          </div>
        )}
      </div>

      <input
        placeholder={t.search}
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ ...styles.input, marginBottom: 12 }}
      />
      <div style={{ maxHeight: 250, overflowY: "auto" }}>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 13 }}>{t.noResults}</div>}
        {filtered.map((c) => (
          <div key={c.id} onClick={() => { stopCamera(); onScanned(c, "normal"); }}
            style={{ ...styles.listItem, marginBottom: 6 }}>
            <div style={styles.avatar(36)}>{(c.name||c.username||"?")[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name||c.username}</div>
              <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 1 }}>{c.points}P · {c.stamps}</div>
            </div>
            <span style={{ color: "var(--fg3)", fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SLIDE TO CONFIRM ─────────────────────────────────────────────────────────
function SlideToConfirm({ label, onConfirm, color = "#2563eb" }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [x, setX] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const startXRef = useRef(0);
  const KNOB = 56;

  const getTrackWidth = () => (trackRef.current?.offsetWidth || 280) - KNOB - 8;

  const onStart = (clientX) => {
    if (confirmed) return;
    setDragging(true);
    startXRef.current = clientX - x;
  };
  const onMove = (clientX) => {
    if (!dragging) return;
    const max = getTrackWidth();
    const nx = Math.max(0, Math.min(clientX - startXRef.current, max));
    setX(nx);
    if (nx >= max - 2) {
      setDragging(false);
      setConfirmed(true);
      setTimeout(() => onConfirm(), 300);
    }
  };
  const onEnd = () => {
    if (!confirmed) { setDragging(false); setX(0); }
  };

  const progress = Math.min(x / Math.max(getTrackWidth(), 1), 1);

  return (
    <div
      ref={trackRef}
      onMouseDown={e => onStart(e.clientX)}
      onMouseMove={e => dragging && onMove(e.clientX)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={e => onStart(e.touches[0].clientX)}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
      onTouchEnd={onEnd}
      style={{
        position: "relative", height: KNOB + 8, borderRadius: (KNOB + 8) / 2,
        background: confirmed
          ? color
          : `linear-gradient(90deg, ${color}33 0%, ${color}11 100%)`,
        border: `1.5px solid ${color}55`,
        cursor: confirmed ? "default" : "grab",
        userSelect: "none", touchAction: "none",
        overflow: "hidden", transition: "background 0.3s",
      }}
    >
      {/* Fill */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: `calc(${x}px + ${KNOB + 4}px)`,
        background: `${color}22`,
        borderRadius: "inherit",
        transition: dragging ? "none" : "width 0.3s ease",
        pointerEvents: "none",
      }} />
      {/* Label */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 14, fontWeight: 600,
        color: confirmed ? "#fff" : color,
        letterSpacing: 0.3, pointerEvents: "none",
        opacity: confirmed ? 1 : Math.max(0.4, 1 - progress * 1.5),
        transition: "color 0.3s, opacity 0.2s",
      }}>
        {confirmed ? <><i className="fa-solid fa-check" style={{ marginRight: 8 }}></i>Bestätigt</> : label}
      </div>
      {/* Knob */}
      <div style={{
        position: "absolute", top: 4, left: 4 + x,
        width: KNOB, height: KNOB, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: color, fontSize: 22,
        transition: dragging ? "none" : "left 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: "none",
      }}>
        <i className={confirmed ? "fa-solid fa-check" : "fa-solid fa-chevron-right"}></i>
      </div>
    </div>
  );
}

// ─── POINT SLIDER ─────────────────────────────────────────────────────────────
function PointSlider({ customer, euroPerPoint, onConfirm, onClose, t }) {
  const [amountStr, setAmountStr] = useState("");
  const [done, setDone] = useState(false);
  const [givenPts, setGivenPts] = useState(0);
  const amount = parseFloat(amountStr.replace(",", ".")) || 0;
  const pts = Math.floor(amount / euroPerPoint);

  if (done) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 52, color: "var(--accent)", marginBottom: 14 }}>
        <i className="fa-solid fa-circle-check"></i>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>+{givenPts} {t.points}</div>
      <div style={{ fontSize: 13, color: "var(--fg2)", marginBottom: 28 }}>{customer.name || customer.username}</div>
      <button onClick={onClose} style={styles.btn}>{t.done}</button>
    </div>
  );

  return (
    <div>
      {/* Customer row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={styles.avatar(44)}>{(customer.name || customer.username || "?")[0].toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{customer.name || customer.username}</div>
          <div style={{ fontSize: 12, color: "var(--fg2)" }}>{customer.points} {t.points}</div>
        </div>
      </div>

      {/* Amount input */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--fg3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{t.purchaseAmount}</div>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            autoFocus
            style={{
              ...styles.input,
              fontSize: 36, fontWeight: 700, textAlign: "center",
              padding: "18px 48px 18px 16px",
              background: "var(--surface2)", marginBottom: 0,
              color: amount > 0 ? "var(--fg)" : "var(--fg3)",
              letterSpacing: -1,
            }}
          />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 24, fontWeight: 700, color: "var(--fg3)" }}>€</span>
        </div>
        {amount > 0 && (
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 14, color: "var(--fg2)" }}>
            = <strong style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>{pts}</strong> {t.points}
            <span style={{ fontSize: 11, color: "var(--fg3)", marginLeft: 6 }}>(1P / {euroPerPoint}€)</span>
          </div>
        )}
      </div>

      {/* Slide to confirm */}
      {pts > 0 ? (
        <SlideToConfirm
          label={`Schieben: ${pts}P vergeben`}
          color="var(--accent)"
          onConfirm={() => { onConfirm(pts); setGivenPts(pts); setDone(true); }}
        />
      ) : (
        <div style={{ height: 64, borderRadius: 40, background: "var(--surface2)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg3)", fontSize: 13 }}>
          Betrag eingeben um fortzufahren
        </div>
      )}
    </div>
  );
}

// ─── BONUS REDEEM PANEL ───────────────────────────────────────────────────────
function BonusRedeemPanel({ customer, settings, onRedeem, onClose, t }) {
  const prog = settings.stampCardMode === "loop"
    ? customer.stamps % settings.stampCardSize
    : customer.stamps;

  const pendingBonuses = settings.rewards.filter(r => {
    const count = (customer.collectedBonuses||[]).filter(b => b.rewardId === r.id).length;
    return count > 0;
  }).map(r => ({
    ...r,
    count: (customer.collectedBonuses||[]).filter(b => b.rewardId === r.id).length,
  }));

  const pendingCoupons = settings.coupons.filter(c => {
    const alreadyRedeemed = !c.keepAfterRedeem && (customer.redeemedCoupons || []).includes(c.id);
    return c.active && !alreadyRedeemed;
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>Einlösen</div>
        <button onClick={onClose} style={styles.iconBtn}><i className="fa-solid fa-xmark"></i></button>
      </div>

      {/* Customer row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
        <div style={styles.avatar(36)}>{(customer.name || customer.username || "?")[0].toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{customer.name || customer.username}</div>
          <div style={{ fontSize: 11, color: "var(--fg2)" }}>{customer.points} {t.points}</div>
        </div>
      </div>

      {pendingBonuses.length === 0 && pendingCoupons.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--fg2)", fontSize: 13 }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: "var(--fg3)", display: "block", marginBottom: 10 }}></i>
          Keine offenen Belohnungen
        </div>
      )}

      {pendingBonuses.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>{t.pendingBonuses}</div>
          {pendingBonuses.map(r => (
            <div key={r.id} style={{ ...styles.card, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <Icon v={r.icon} size={20} />
                  {r.count > 1 && (
                    <div style={{ position: "absolute", top: -6, right: -6, background: "var(--accent)", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, border: "2px solid var(--bg)" }}>
                      {r.count}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2 }}>{r.description}</div>
                  {r.pointsOnRedeem > 0 && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>+{r.pointsOnRedeem}P</div>}
                </div>
              </div>
              <SlideToConfirm label="Schieben zum Einlösen" color="var(--accent)" onConfirm={() => onRedeem("bonus", r.id)} />
            </div>
          ))}
        </>
      )}

      {pendingCoupons.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: pendingBonuses.length > 0 ? 8 : 0 }}>{t.pendingCoupons}</div>
          {pendingCoupons.map(c => (
            <div key={c.id} style={{ ...styles.card, marginBottom: 12, border: "1.5px solid var(--accent)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="fa-solid fa-ticket" style={{ fontSize: 20, color: "var(--accent)" }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)", letterSpacing: 1.5 }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2 }}>{c.discount} · bis {fmtDate(c.validUntil)}</div>
                  {c.pointsOnRedeem > 0 && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>+{c.pointsOnRedeem}P</div>}
                </div>
              </div>
              <SlideToConfirm label="Schieben zum Einlösen" color="var(--accent)" onConfirm={() => onRedeem("coupon", c.id)} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}



// ─── ICON HELPER ──────────────────────────────────────────────────────────────
// Renders a FA class string (e.g. "fa-solid fa-mug-hot") as <i>, or plain text/emoji as-is
const Icon = ({ v, size = 18, style = {} }) => {
  if (!v) return null;
  if (typeof v === "string" && v.startsWith("fa-")) {
    return <i className={v} style={{ fontSize: size, ...style }}></i>;
  }
  return <span style={{ fontSize: size, ...style }}>{v}</span>;
};

// FA icon picker options for rewards/coupons
const FA_ICON_OPTIONS = [
  { label: "Kaffee",    cls: "fa-solid fa-mug-hot" },
  { label: "Rabatt",    cls: "fa-solid fa-tag" },
  { label: "Geschenk",  cls: "fa-solid fa-gift" },
  { label: "Ticket",    cls: "fa-solid fa-ticket" },
  { label: "Stern",     cls: "fa-solid fa-star" },
  { label: "Herz",      cls: "fa-solid fa-heart" },
  { label: "Tasse",     cls: "fa-solid fa-mug-saucer" },
  { label: "Kuchen",    cls: "fa-solid fa-cake-candles" },
  { label: "Pizza",     cls: "fa-solid fa-pizza-slice" },
  { label: "Burger",    cls: "fa-solid fa-burger" },
  { label: "Eis",       cls: "fa-solid fa-ice-cream" },
  { label: "Bier",      cls: "fa-solid fa-beer-mug-empty" },
  { label: "Wein",      cls: "fa-solid fa-wine-glass" },
  { label: "Blitz",     cls: "fa-solid fa-bolt" },
  { label: "Krone",     cls: "fa-solid fa-crown" },
  { label: "Feuer",     cls: "fa-solid fa-fire" },
  { label: "Trophäe",   cls: "fa-solid fa-trophy" },
  { label: "Diamant",   cls: "fa-solid fa-gem" },
  { label: "Prozent",   cls: "fa-solid fa-percent" },
  { label: "Euro",      cls: "fa-solid fa-euro-sign" },
];

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: ["#3b82f6","#f59e0b","#22c55e","#f43f5e","#a855f7","#06b6d4"][Math.floor(Math.random()*6)],
      rot: Math.random() * 360,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      vr: (Math.random() - 0.5) * 6,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x + p.w/2, p.y + p.h/2);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999 }} />;
}

// ─── STAMP CARD ───────────────────────────────────────────────────────────────
function StampCard({ stamps, settings, onStamp }) {
  const { stampCardMode, stampCardSize, rewards, pointsPerStamp = 10 } = settings;
  const round = Math.floor(stamps / stampCardSize); // which round we're on (0-based)
  const progress = stamps % stampCardSize; // position within current card
  const cardStart = round * stampCardSize; // e.g. round 1 = stamps 10-19
  const cells = Array.from({ length: stampCardSize }, (_, i) => i + 1);

  // Build reward map using stamp numbers relative to card position (1-10)
  const rewardMap = {};
  rewards.forEach(r => { if (r.stamps <= stampCardSize) rewardMap[r.stamps] = r; });

  return (
    <div style={{ ...styles.card, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
          Stempelkarte
          {round > 0 && <span style={{ fontSize: 11, color: "var(--fg3)", marginLeft: 8 }}>Runde {round + 1}</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg2)" }}>{progress}/{stampCardSize}</div>
      </div>
      <div style={{ fontSize: 11, color: "var(--fg3)", marginBottom: 12 }}>
        1 Stempel = <strong style={{ color: "var(--accent)" }}>{pointsPerStamp} Punkte</strong>
        {onStamp && <span style={{ marginLeft: 6 }}>· Feld antippen zum Einlösen</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
        {cells.map(i => {
          const filled = i <= progress;
          const rw = rewardMap[i];
          const actualNum = cardStart + i; // show actual cumulative number
          return (
            <div key={i}
              onClick={() => !filled && onStamp && onStamp()}
              style={{
                aspectRatio: "1", borderRadius: 10,
                background: filled ? "var(--accent)" : "transparent",
                border: `2px solid ${rw && !filled ? "#f59e0b" : filled ? "var(--accent)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 2,
                position: "relative",
                cursor: !filled && onStamp ? "pointer" : "default",
              }}>
              <span style={{ fontSize: actualNum >= 100 ? 11 : 14, fontWeight: 800, lineHeight: 1, color: filled ? "#fff" : rw ? "#f59e0b" : "var(--fg2)" }}>
                {actualNum}
              </span>
              {rw && <Icon v={rw.icon} size={10} style={{ color: filled ? "rgba(255,255,255,0.8)" : "#f59e0b" }} />}
              {rw && <div style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, background: "#f59e0b", borderRadius: "50%", border: "2px solid var(--bg)" }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  btn: {
    width: "100%", padding: "13px 18px", borderRadius: 8,
    background: "var(--accent)", color: "#fff", border: "none",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnSecondary: {
    width: "100%", padding: "12px 18px", borderRadius: 8,
    background: "transparent", color: "var(--fg)", border: "1px solid var(--border)",
    cursor: "pointer", fontSize: 14, fontWeight: 500,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnDanger: {
    width: "100%", padding: "12px 18px", borderRadius: 8,
    background: "transparent", color: "#ef4444", border: "1px solid #fee2e2",
    cursor: "pointer", fontSize: 14, fontWeight: 500,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  input: {
    width: "100%", padding: "11px 14px", borderRadius: 8,
    border: "1px solid var(--border)", background: "var(--surface2)",
    color: "var(--fg)", fontSize: 14, outline: "none",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "14px 16px",
  },
  avatar: (size) => ({
    width: size, height: size, borderRadius: "50%",
    background: "var(--accent-bg)", color: "var(--accent)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.4, fontWeight: 700, flexShrink: 0,
  }),
  listItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "11px 14px", borderRadius: 10, cursor: "pointer",
    background: "var(--surface)", border: "1px solid var(--border)",
  },
  iconBtn: {
    background: "var(--surface2)", border: "1px solid var(--border)",
    color: "var(--fg2)", borderRadius: 8, padding: "7px 12px",
    cursor: "pointer", fontSize: 13,
  },
  chipBtn: {
    padding: "8px 4px", borderRadius: 8,
    border: "1px solid var(--border)", background: "transparent",
    color: "var(--fg2)", fontWeight: 600, fontSize: 12, cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  },
  chipBtnActive: {
    border: "1px solid var(--accent)", background: "var(--accent-bg)",
    color: "var(--accent)",
  },
  label: {
    fontSize: 11, fontWeight: 600, color: "var(--fg3)",
    textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 5,
  },
  badge: (color) => ({
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "3px 8px", borderRadius: 20,
    background: color === "green" ? "#dcfce7" : color === "red" ? "#fee2e2" : color === "blue" ? "#dbeafe" : color === "amber" ? "#fef3c7" : "#f3f4f6",
    color: color === "green" ? "#15803d" : color === "red" ? "#dc2626" : color === "blue" ? "#1d4ed8" : color === "amber" ? "#b45309" : "#6b7280",
    fontSize: 11, fontWeight: 600,
  }),
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 300 }}
      onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{
        width: "100%", maxWidth: 430,
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
        padding: "20px 18px 36px", maxHeight: "88vh", overflowY: "auto",
        border: "1px solid var(--border)", borderBottom: "none",
        fontFamily: "Arial, sans-serif",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ tabs, active, setActive }) {
  return (
    <div style={{ display: "flex", background: "var(--bg)", borderTop: "1px solid var(--border)", paddingBottom: 12, paddingTop: 4, flexShrink: 0 }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <div key={t.id} onClick={() => setActive(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", cursor: "pointer",
              color: on ? "var(--accent)" : "var(--fg3)", transition: "color 0.15s" }}>
            <i className={t.icon} style={{ fontSize: 18 }}></i>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{t.label}</span>
            {on && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)", marginTop: -1 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ title, sub, right }) {
  return (
    <div style={{ padding: "14px 18px 12px", background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", fontFamily: "Arial, sans-serif" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── CHANGE NAME CARD ─────────────────────────────────────────────────────────
function ChangeNameCard({ cust, setCustomers, lt }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(cust.name || "");
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  if (!open) return (
    <button onClick={() => { setOpen(true); setNewName(cust.name||""); setErr(""); setOk(false); }}
      style={{ ...styles.btnSecondary, marginBottom: 12, fontSize: 13 }}>
      ✎ Name / Passwort ändern
    </button>
  );

  return (
    <div style={{ ...styles.card, marginBottom: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Name &amp; Passwort ändern</div>
      <label style={styles.label}>Vollständiger Name (= Login-Name)</label>
      <input value={newName} onChange={e => setNewName(e.target.value)} style={{ ...styles.input, marginBottom: 10 }} />
      <label style={styles.label}>Neues Passwort (leer lassen = unverändert)</label>
      <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Neues Passwort" style={{ ...styles.input, marginBottom: 8 }} />
      {newPwd && (
        <>
          <label style={styles.label}>Passwort bestätigen</label>
          <input type="password" value={newPwdConfirm} onChange={e => setNewPwdConfirm(e.target.value)} placeholder="Bestätigen" style={{ ...styles.input, marginBottom: 8 }} />
        </>
      )}
      {err && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{err}</div>}
      {ok && <div style={{ color: "#22c55e", fontSize: 12, marginBottom: 8 }}><i className="fa-solid fa-check" style={{marginRight:4}}></i>Gespeichert</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => {
          if (!newName.trim()) { setErr("Name darf nicht leer sein"); return; }
          if (newPwd && newPwd !== newPwdConfirm) { setErr("Passwörter stimmen nicht überein"); return; }
          setCustomers(cs => cs.map(c => c.id === cust.id ? {
            ...c, name: newName.trim(), username: newName.trim(),
            ...(newPwd ? { password: newPwd } : {})
          } : c));
          setErr(""); setOk(true); setNewPwd(""); setNewPwdConfirm("");
          setTimeout(() => setOpen(false), 1000);
        }} style={{ ...styles.btn, flex: 1 }}>Speichern</button>
        <button onClick={() => setOpen(false)} style={{ ...styles.btnSecondary, flex: 1 }}>Abbrechen</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [activeUser, setActiveUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [employees, setEmployees] = useState(INIT_EMPLOYEES);
  const [settings, setSettings] = useState(INIT_SETTINGS);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [setupForm, setSetupForm] = useState({ name: "", birthdate: "", email: "", phone: "", password: "", confirm: "" });
  const [setupError, setSetupError] = useState("");
  const [forgotStep, setForgotStep] = useState(0); // 0=hidden 1=form 2=code
  const [forgotForm, setForgotForm] = useState({ name: "", email: "" });
  const [forgotCode, setForgotCode] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [modal, setModal] = useState(null);
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [scannedMode, setScannedMode] = useState("normal");

  // Get current customer data fresh
  const getCust = (id) => customers.find(c => c.id === id);
  const cust = activeUser?.role === "customer" ? getCust(activeUser.id) : null;
  const t = T[(cust?.language || "de")];

  const darkMode = cust?.darkMode !== false;

  // Theme vars
  const theme = darkMode ? {
    "--bg": "#0f1117",
    "--surface": "#1a1d27",
    "--surface2": "#1f2230",
    "--border": "rgba(255,255,255,0.09)",
    "--fg": "#f0f0f5",
    "--fg2": "#8b8ba0",
    "--fg3": "#55556a",
    "--accent": "#3b82f6",
    "--accent-bg": "rgba(59,130,246,0.12)",
  } : {
    "--bg": "#ffffff",
    "--surface": "#f9fafb",
    "--surface2": "#f3f4f6",
    "--border": "rgba(0,0,0,0.1)",
    "--fg": "#111827",
    "--fg2": "#6b7280",
    "--fg3": "#9ca3af",
    "--accent": "#2563eb",
    "--accent-bg": "rgba(37,99,235,0.08)",
  };

  const handleLogin = () => {
    setLoginError("");
    const { username, password } = loginForm;
    if (username === ADMIN_CRED.username && password === ADMIN_CRED.password) {
      setActiveUser({ role: "admin", name: "Administrator" });
      setScreen("admin"); setActiveTab("overview"); return;
    }
    const emp = employees.find(e => e.code === username && e.active);
    if (emp && password === emp.code) {
      setActiveUser({ role: "employee", name: emp.name, id: emp.id });
      setScreen("employee"); setActiveTab("scan"); return;
    }
    // match by username OR by full name (case-insensitive)
    const c = customers.find(c => (c.username === username || c.name?.toLowerCase() === username.toLowerCase()) && c.password === password);
    if (c) {
      setActiveUser({ role: "customer", id: c.id });
      setScreen(c.firstLogin ? "setup" : "customer");
      setActiveTab("card"); return;
    }
    setLoginError(T.de.invalidCredentials);
  };

  const handleSetup = () => {
    if (!setupForm.name || !setupForm.birthdate || !setupForm.email || !setupForm.password) {
      setSetupError(t.fillAllFields); return;
    }
    if (setupForm.password !== setupForm.confirm) {
      setSetupError(t.passwordMismatch); return;
    }
    setCustomers(cs => cs.map(c => c.id === activeUser.id
      ? { ...c, name: setupForm.name, username: setupForm.name, birthdate: setupForm.birthdate, email: setupForm.email, phone: setupForm.phone, password: setupForm.password, firstLogin: false }
      : c));
    setScreen("customer"); setActiveTab("card");
  };

  const logout = () => { setScreen("login"); setActiveUser(null); setModal(null); setLoginForm({ username: "", password: "" }); };

  const addPoints = (customerId, pts, empId) => {
    setCustomers(cs => cs.map(c => {
      if (c.id !== customerId) return c;
      const np = c.points + pts;
      return { ...c, points: np, stamps: c.stamps + 1, tier: calcTier(np),
        history: [{ id: genId(), date: today(), type: "earn", amount: pts, desc: `+${pts}P (${Math.round(pts * settings.euroPerPoint)}€)`, emp: empId ? (employees.find(e=>e.id===empId)?.name||"") : "Admin" }, ...c.history] };
    }));
    if (empId) {
      setEmployees(es => es.map(e => e.id === empId ? { ...e, stats: { ...e.stats, scans: e.stats.scans+1, pointsGiven: e.stats.pointsGiven+pts, lastActive: today() } } : e));
    }
  };

  const redeemItem = (customerId, type, itemId, empId) => {
    setCustomers(cs => cs.map(c => {
      if (c.id !== customerId) return c;
      let bonusPoints = 0;
      if (type === "bonus") {
        const rw = settings.rewards.find(r => r.id === itemId);
        if (rw) bonusPoints = rw.pointsOnRedeem || 0;
        // Remove one collected bonus entry with this rewardId
        const collected = c.collectedBonuses || [];
        const idx = collected.findIndex(b => b.rewardId === itemId);
        const newCollected = idx >= 0 ? [...collected.slice(0, idx), ...collected.slice(idx + 1)] : collected;
        return { ...c, collectedBonuses: newCollected, points: c.points + bonusPoints,
          history: [{ id: genId(), date: today(), type: "earn", amount: bonusPoints, desc: `Bonus eingelöst: ${rw?.name||itemId}`, emp: empId ? (employees.find(e=>e.id===empId)?.name||"") : "Admin" }, ...c.history] };
      } else {
        const cp = settings.coupons.find(cp => cp.id === itemId);
        if (cp) bonusPoints = cp.pointsOnRedeem || 0;
        const newRedeemed = cp?.keepAfterRedeem ? c.redeemedCoupons : [...(c.redeemedCoupons||[]), itemId];
        return { ...c, redeemedCoupons: newRedeemed, points: c.points + bonusPoints,
          history: [{ id: genId(), date: today(), type: "earn", amount: bonusPoints, desc: `Coupon eingelöst: ${cp?.code||itemId}`, emp: empId ? (employees.find(e=>e.id===empId)?.name||"") : "Admin" }, ...c.history] };
      }
    }));
    if (type === "coupon") {
      setSettings(s => ({ ...s, coupons: s.coupons.map(c => c.id === itemId ? { ...c, usageCount: (c.usageCount||0)+1 } : c) }));
    }
  };

  const handleScanned = (c, mode, extraId) => {
    setScannedCustomer(c);
    setScannedMode(mode || "normal");
    setModal(mode === "bonus" || mode === "coupon" ? "redeem" : "points");
  };

  const openScan = () => { setScannedCustomer(null); setScannedMode("normal"); setModal("scan"); };

  const cssVars = Object.entries(theme).map(([k,v]) => `${k}:${v}`).join(";");

  const wrapStyle = {
    minHeight: "100vh",
    background: "var(--bg)",
    fontFamily: "Arial, sans-serif",
    color: "var(--fg)",
  };

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  if (screen === "login") return (
    <div style={{ ...wrapStyle, ...Object.fromEntries(Object.entries(theme)) }}>
      <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Arial, sans-serif; } input:focus { outline: 2px solid var(--accent); outline-offset: -1px; } .fa-solid, .fa-regular { font-style: normal; }`}</style>
      </>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, background: "#0f1117" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}><i className="fa-solid fa-star" style={{color:"#fff"}}></i></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>LoyaltyPass</div>
            <div style={{ fontSize: 13, color: "#8b8ba0" }}>Bonusprogramm</div>
          </div>

          {/* FORGOT PASSWORD */}
          {forgotStep > 0 && (
            <div style={{ background: "#1a1d27", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.09)", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <button onClick={() => { setForgotStep(0); setForgotForm({ name:"", email:"" }); setForgotCode(""); setForgotError(""); }}
                  style={{ background: "none", border: "none", color: "#8b8ba0", cursor: "pointer", fontSize: 14, lineHeight: 1 }}><i className="fa-solid fa-arrow-left"></i></button>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Passwort vergessen</div>
              </div>
              {forgotStep === 1 && (
                <>
                  <div style={{ fontSize: 12, color: "#8b8ba0", marginBottom: 14, lineHeight: 1.5 }}>
                    Vollständigen Namen und E-Mail-Adresse eingeben. Du erhältst einen Reset-Code.
                  </div>
                  <div style={{ fontSize: 11, color: "#55556a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>Vollständiger Name</div>
                  <input placeholder="Max Mustermann" value={forgotForm.name} onChange={e => setForgotForm(f => ({ ...f, name: e.target.value }))}
                    style={{ ...styles.input, marginBottom: 10, background: "#1f2230", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f0f5" }} />
                  <div style={{ fontSize: 11, color: "#55556a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>E-Mail-Adresse</div>
                  <input type="email" placeholder="name@email.de" value={forgotForm.email} onChange={e => setForgotForm(f => ({ ...f, email: e.target.value }))}
                    style={{ ...styles.input, marginBottom: 12, background: "#1f2230", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f0f5" }} />
                  {forgotError && <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>{forgotError}</div>}
                  <button onClick={() => {
                    const match = customers.find(c =>
                      c.name?.toLowerCase().trim() === forgotForm.name.toLowerCase().trim() &&
                      c.email?.toLowerCase().trim() === forgotForm.email.toLowerCase().trim()
                    );
                    if (!match) { setForgotError("Kein Konto mit diesen Daten gefunden."); return; }
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setForgotCode(code);
                    setForgotStep(2);
                    setForgotError("");
                  }} style={{ ...styles.btn, background: "#3b82f6" }}>Code anfordern</button>
                </>
              )}
              {forgotStep === 2 && (
                <>
                  <div style={{ background: "#0f2d1a", border: "1px solid #166534", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#86efac", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}><i className="fa-solid fa-envelope" style={{marginRight:4}}></i>Code würde per E-Mail gesendet an:</div>
                    <div style={{ fontSize: 13, color: "#bbf7d0", marginBottom: 10 }}>{forgotForm.email}</div>
                    <div style={{ fontSize: 11, color: "#86efac", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Dein Reset-Code (Demo):</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", letterSpacing: 6, fontFamily: "monospace" }}>{forgotCode}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#8b8ba0", marginBottom: 14 }}>
                    Im echten Betrieb wird dieser Code per E-Mail zugestellt. Hier zur Demo direkt angezeigt.
                  </div>
                  <button onClick={() => {
                    const match = customers.find(c =>
                      c.name?.toLowerCase().trim() === forgotForm.name.toLowerCase().trim() &&
                      c.email?.toLowerCase().trim() === forgotForm.email.toLowerCase().trim()
                    );
                    if (match) {
                      setLoginForm({ username: match.name, password: "" });
                    }
                    setForgotStep(0); setForgotForm({ name:"", email:"" }); setForgotCode("");
                    alert(`Passwort-Reset: Bitte Admin kontaktieren oder neues Passwort im Konto-Tab setzen.\n\nBenutzername: ${match?.name||""}`);
                  }} style={{ ...styles.btn, background: "#3b82f6" }}>Zurück zum Login</button>
                </>
              )}
            </div>
          )}

          {/* NORMAL LOGIN */}
          {forgotStep === 0 && (
            <div style={{ background: "#1a1d27", borderRadius: 14, padding: 24, border: "1px solid rgba(255,255,255,0.09)", marginBottom: 16 }}>
              <input placeholder="Benutzername" value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                style={{ ...styles.input, marginBottom: 10, background: "#1f2230", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f0f5" }} />
              <input type="password" placeholder="Passwort" value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={{ ...styles.input, marginBottom: 12, background: "#1f2230", border: "1px solid rgba(255,255,255,0.09)", color: "#f0f0f5" }} />
              {loginError && <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>{loginError}</div>}
              <button onClick={handleLogin} style={{ ...styles.btn, background: "#3b82f6", marginBottom: 10 }}>Anmelden</button>
              <button onClick={() => { setForgotStep(1); setForgotError(""); }}
                style={{ background: "none", border: "none", color: "#8b8ba0", cursor: "pointer", fontSize: 13, width: "100%", textAlign: "center", padding: "4px 0" }}>
                Passwort vergessen?
              </button>
            </div>
          )}

          <div style={{ background: "#1a1d27", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ fontSize: 10, color: "#55556a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Demo-Zugänge</div>
            {[["admin","admin","Administrator"],["EMP001","EMP001","Mitarbeiter: Sophie"],["Max Mustermann","welcome123","Kunde: Max"]].map(([u,p,l]) => (
              <div key={u} onClick={() => setLoginForm({ username: u, password: p })}
                style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
                <span style={{ fontSize: 12, color: "#8b8ba0" }}>{l}</span>
                <span style={{ fontSize: 11, color: "#55556a", fontFamily: "monospace" }}>{u}/{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── SETUP ─────────────────────────────────────────────────────────────────
  if (screen === "setup") {
    const lt = T.de;
    return (
      <div style={{ ...wrapStyle, ...Object.fromEntries(Object.entries(theme)) }}>
        <>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input:focus { outline: 2px solid var(--accent); } .fa-solid, .fa-regular { font-style: normal; }`}</style>
        </>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 360 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>Hi</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>{lt.completeProfile}</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
              {[["Vollständiger Name","name","text"],["Geburtsdatum","birthdate","date"],["E-Mail","email","email"],["Telefon (optional)","phone","tel"],["Neues Passwort","password","password"],["Passwort bestätigen","confirm","password"]].map(([lb,k,tp]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <label style={styles.label}>{lb}</label>
                  <input type={tp} value={setupForm[k]} onChange={e => setSetupForm(f => ({ ...f, [k]: e.target.value }))} style={styles.input} />
                </div>
              ))}
              {setupError && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{setupError}</div>}
              <button onClick={handleSetup} style={styles.btn}>{lt.save} →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "customer" && cust) {
    const lt = T[cust.language||"de"];
    const themeVars = cust.darkMode !== false ? theme : {
      "--bg": "#ffffff", "--surface": "#f9fafb", "--surface2": "#f3f4f6",
      "--border": "rgba(0,0,0,0.1)", "--fg": "#111827", "--fg2": "#6b7280",
      "--fg3": "#9ca3af", "--accent": "#2563eb", "--accent-bg": "rgba(37,99,235,0.08)",
    };
    const prog = cust.stamps % settings.stampCardSize;

    // Celebration state
    const [showConfetti, setShowConfetti] = useState(false);
    const [celebModal, setCelebModal] = useState(null); // "card" | reward object
    const prevStampsRef = useRef(cust.stamps);

    useEffect(() => {
      const prev = prevStampsRef.current;
      const cur = cust.stamps;
      if (cur <= prev) { prevStampsRef.current = cur; return; }
      prevStampsRef.current = cur;

      const cardSize = settings.stampCardSize;
      const curProg = cur % cardSize;
      const prevProg = prev % cardSize;

      // Card full?
      if (cur > prev && curProg === 0 && cur > 0) {
        setShowConfetti(true);
        setCelebModal("card");
        setTimeout(() => setShowConfetti(false), 4000);
        return;
      }

      // Bonus unlocked?
      const newlyUnlocked = settings.rewards.find(r => r.stamps === curProg && r.stamps > prevProg);
      if (newlyUnlocked) {
        setCelebModal(newlyUnlocked);
      }
    }, [cust.stamps]);

    const tabs = [
      { id: "card", label: "Karte", icon: "fa-solid fa-id-card" },
      { id: "bonus", label: lt.rewards, icon: "fa-solid fa-gift" },
      { id: "history", label: lt.history, icon: "fa-solid fa-clock-rotate-left" },
      { id: "account", label: lt.account, icon: "fa-solid fa-circle-user" },
    ];

    const unlockedBonuses = settings.rewards.filter(r =>
      (cust.collectedBonuses||[]).some(b => b.rewardId === r.id) &&
      !(cust.hiddenFromQR||[]).includes(r.id)
    );
    const availCoupons = settings.coupons.filter(c =>
      c.active && !(cust.hiddenFromQR||[]).includes(c.id)
    );
    const hiddenBonuses = settings.rewards.filter(r =>
      (cust.collectedBonuses||[]).some(b => b.rewardId === r.id) &&
      (cust.hiddenFromQR||[]).includes(r.id)
    );
    const hiddenCoupons = settings.coupons.filter(c =>
      c.active && (cust.hiddenFromQR||[]).includes(c.id)
    );

    // Next reward
    const nextReward = settings.rewards
      .filter(r => r.stamps > prog)
      .sort((a, b) => a.stamps - b.stamps)[0];

    const handleStamp = () => {
      const cost = settings.pointsPerStamp || 10;
      if (cust.points < cost) { alert(`Nicht genug Punkte. Du brauchst ${cost}P für einen Stempel.`); return; }
      const newStamps = cust.stamps + 1;
      const newProg = newStamps % settings.stampCardSize;
      // Check if a bonus milestone is hit
      const unlockedReward = settings.rewards.find(r => r.stamps === newProg || (newProg === 0 && r.stamps === settings.stampCardSize));
      setCustomers(cs => cs.map(c => {
        if (c.id !== cust.id) return c;
        const newCollected = unlockedReward
          ? [...(c.collectedBonuses||[]), { uid: genId(), rewardId: unlockedReward.id, earnedOn: today() }]
          : (c.collectedBonuses||[]);
        return {
          ...c,
          points: c.points - cost,
          stamps: newStamps,
          tier: calcTier(c.points - cost),
          collectedBonuses: newCollected,
          history: [{ id: genId(), date: today(), type: "redeem", amount: -cost, desc: `Stempel eingelöst (${cost}P)`, emp: "" }, ...c.history]
        };
      }));
    };

    const renderTab = () => {
      if (activeTab === "card") return (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{lt.points}</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{cust.points}</div>
              </div>
              <span style={{ ...styles.badge(cust.tier === "gold" ? "amber" : cust.tier === "silver" ? "blue" : ""), alignSelf: "flex-start", marginTop: 4 }}>
                {TIER_CONFIG[cust.tier]?.label}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg2)" }}>
              <span>{cust.name}</span>
              <span>{lt.memberSince}: {fmtDate(cust.memberSince)}</span>
            </div>
          </div>

          <StampCard stamps={cust.stamps} settings={settings} />

          {/* Next reward */}
          {nextReward && (
            <div style={{ ...styles.card, marginBottom: 12, display: "flex", alignItems: "center", gap: 12, border: "1px solid #f59e0b44" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f59e0b22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon v={nextReward.icon} size={20} style={{ color: "#f59e0b" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Nächste Belohnung</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{nextReward.name}</div>
                <div style={{ marginTop: 5, height: 4, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((prog / nextReward.stamps) * 100, 100)}%`, background: "#f59e0b", borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 3 }}>{nextReward.stamps - prog} Stempel fehlen</div>
              </div>
            </div>
          )}


          <div style={{ ...styles.card, textAlign: "center", padding: "20px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "var(--fg2)", marginBottom: 12 }}>{lt.myQRCode}</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
              <div style={{ background: "#fff", padding: 8, borderRadius: 10 }}>
                <QRCodeDisplay value={`LOYALTY_${cust.id}`} size={130} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--fg3)" }}>Beim Einkauf vorzeigen</div>

            {(unlockedBonuses.length > 0 || availCoupons.length > 0 || hiddenBonuses.length > 0 || hiddenCoupons.length > 0) && (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg2)", marginBottom: 8 }}>Im QR enthalten:</div>
                {unlockedBonuses.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span><Icon v={r.icon} size={14} /></span>
                    <span style={{ fontSize: 12, color: "var(--fg)", flex: 1 }}>{r.name}</span>
                    <button onClick={() => removeFromQR(r.id)}
                      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, color: "var(--fg3)" }}>
                      Entfernen
                    </button>
                  </div>
                ))}
                {availCoupons.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span><i className="fa-solid fa-ticket"></i></span>
                    <span style={{ fontSize: 12, color: "var(--fg)", flex: 1 }}>{c.code} – {c.discount}</span>
                    <button onClick={() => removeFromQR(c.id)}
                      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, color: "var(--fg3)" }}>
                      Entfernen
                    </button>
                  </div>
                ))}
                {(hiddenBonuses.length > 0 || hiddenCoupons.length > 0) && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg3)", marginTop: 10, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 }}>Ausgeblendet:</div>
                    {hiddenBonuses.map(r => (
                      <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", opacity: 0.6 }}>
                        <span><Icon v={r.icon} size={14} /></span>
                        <span style={{ fontSize: 12, color: "var(--fg)", flex: 1 }}>{r.name}</span>
                        <button onClick={() => restoreToQR(r.id)}
                          style={{ background: "none", border: "1px solid var(--accent)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, color: "var(--accent)" }}>
                          Hinzufügen
                        </button>
                      </div>
                    ))}
                    {hiddenCoupons.map(c => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", opacity: 0.6 }}>
                        <span><i className="fa-solid fa-ticket"></i></span>
                        <span style={{ fontSize: 12, color: "var(--fg)", flex: 1 }}>{c.code} – {c.discount}</span>
                        <button onClick={() => restoreToQR(c.id)}
                          style={{ background: "none", border: "1px solid var(--accent)", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, color: "var(--accent)" }}>
                          Hinzufügen
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          <div style={{ height: 20 }} />
        </div>
      );

      if (activeTab === "bonus") return (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 14 }}>{lt.rewards}</div>
          {settings.rewards.map(r => {
            const collectedCount = (cust.collectedBonuses||[]).filter(b => b.rewardId === r.id).length;
            const available = prog >= r.stamps;
            return (
              <div key={r.id} style={{ ...styles.card, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22, width: 44, height: 44, background: "var(--surface2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <Icon v={r.icon} size={20} />
                    {collectedCount > 0 && (
                      <div style={{ position: "absolute", top: -6, right: -6, background: "var(--accent)", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, border: "2px solid var(--bg)" }}>
                        {collectedCount}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 2 }}>{r.description}</div>
                    <div style={{ marginTop: 6, height: 3, background: "var(--surface2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min((prog/r.stamps)*100,100)}%`, background: available ? "#22c55e" : "var(--accent)", borderRadius: 2 }} />
                    </div>
                  </div>
                  {collectedCount > 0
                    ? <span style={{ ...styles.badge("green"), display: "flex", alignItems: "center", gap: 4 }}>
                        <i className="fa-solid fa-box" style={{ fontSize: 10 }}></i> ×{collectedCount}
                      </span>
                    : available
                      ? <span style={{ ...styles.badge(""), fontSize: 10 }}>Einlösbar</span>
                      : <span style={styles.badge("")}>{r.stamps-prog} {lt.missing}</span>}
                </div>
              </div>
            );
          })}
          {settings.coupons.filter(c => c.active).length > 0 && (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--fg)", marginBottom: 10, marginTop: 6 }}>{lt.coupons}</div>
              {settings.coupons.filter(c => c.active).map(c => {
                const redeemed = (cust.redeemedCoupons||[]).includes(c.id) && !c.keepAfterRedeem;
                return (
                  <div key={c.id} style={{ ...styles.card, marginBottom: 10, border: "1px solid var(--accent)", opacity: redeemed ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", letterSpacing: 1.5 }}>{c.code}</div>
                        <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 3 }}>{c.discount} · bis {fmtDate(c.validUntil)}</div>
                      </div>
                      {redeemed ? <span style={styles.badge("blue")}>Eingelöst</span>
                        : <span><i className="fa-solid fa-ticket"></i></span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div style={{ height: 20 }} />
        </div>
      );

      if (activeTab === "history") return (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 14 }}>{lt.history}</div>
          {cust.history.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--fg3)", fontSize: 13 }}>Noch keine Transaktionen</div>}
          {cust.history.map((h) => (
            <div key={h.id} style={{ ...styles.card, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: h.amount >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: h.amount >= 0 ? "#22c55e" : "#ef4444", flexShrink: 0 }}>
                {h.amount >= 0 ? "+" : "−"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.desc}</div>
                <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 1 }}>{fmtDate(h.date)}{h.emp ? ` · ${h.emp}` : ""}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: h.amount >= 0 ? "#22c55e" : "#ef4444", flexShrink: 0 }}>
                {h.amount >= 0 ? "+" : ""}{h.amount}P
              </div>
            </div>
          ))}
          <div style={{ height: 20 }} />
        </div>
      );

      if (activeTab === "account") return (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ ...styles.card, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={styles.avatar(52)}>{(cust.name||"?")[0].toUpperCase()}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)" }}>{cust.name}</div>
              <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 2 }}>{cust.email}</div>
            </div>
          </div>
          <div style={{ ...styles.card, marginBottom: 12 }}>
            {[["Vollständiger Name (Login)", cust.name||cust.username], ["Geburtsdatum", fmtDate(cust.birthdate)], ["E-Mail", cust.email||"–"], ["Telefon", cust.phone||"–"], ["Punkte", `${cust.points}P`], ["Status", TIER_CONFIG[cust.tier]?.label||""]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--fg2)" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", maxWidth: "55%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Change name / username */}
          <ChangeNameCard cust={cust} setCustomers={setCustomers} lt={lt} />

          <div style={{ ...styles.card, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>{lt.settings}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--fg)" }}>{lt.darkMode}</span>
              <button onClick={() => setCustomers(cs => cs.map(c => c.id === cust.id ? { ...c, darkMode: !c.darkMode } : c))}
                style={{ background: cust.darkMode ? "var(--accent)" : "var(--surface2)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 14px", cursor: "pointer", color: cust.darkMode ? "#fff" : "var(--fg2)", fontSize: 12, fontWeight: 600 }}>
                {cust.darkMode ? "An" : "Aus"}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--fg)" }}>{lt.language}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {["de","en"].map(l => (
                  <button key={l} onClick={() => setCustomers(cs => cs.map(c => c.id === cust.id ? { ...c, language: l } : c))}
                    style={{ ...styles.chipBtn, ...(cust.language===l || (!cust.language && l==="de") ? styles.chipBtnActive : {}) }}>
                    {l === "de" ? "DE" : "EN"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={logout} style={{ ...styles.btnDanger, marginBottom: 20 }}><i className="fa-solid fa-right-from-bracket" style={{marginRight:6}}></i>{lt.logout}</button>
          <div style={{ height: 20 }} />
        </div>
      );
    };

    const removeFromQR = (id) => setCustomers(cs => cs.map(c => c.id === cust.id ? { ...c, hiddenFromQR: [...(c.hiddenFromQR||[]), id] } : c));
    const restoreToQR = (id) => setCustomers(cs => cs.map(c => c.id === cust.id ? { ...c, hiddenFromQR: (c.hiddenFromQR||[]).filter(x => x !== id) } : c));

    return (
      <div style={{ ...wrapStyle, ...themeVars }}>
        <>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Arial, sans-serif; } input:focus { outline: 2px solid var(--accent); } .fa-solid, .fa-regular { font-style: normal; }`}</style>
        </>
        {showConfetti && <Confetti />}
        <div style={{ display: "flex", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Header title={`⭐ ${settings.shopName}`} sub={`${lt.welcomeBack}, ${cust.name?.split(" ")[0]}`} />
            <div style={{ flex: 1, overflowY: "auto" }}>{renderTab()}</div>
            <BottomNav tabs={tabs} active={activeTab} setActive={setActiveTab} />
          </div>
        </div>

        {/* Card complete celebration */}
        {celebModal === "card" && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 20 }}>
            <div style={{ background: "var(--bg)", borderRadius: 20, padding: "36px 28px", textAlign: "center", maxWidth: 320, width: "100%", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🎉</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)", marginBottom: 8 }}>Karte voll!</div>
              <div style={{ fontSize: 14, color: "var(--fg2)", marginBottom: 24, lineHeight: 1.6 }}>
                Herzlichen Glückwunsch! Du hast alle {settings.stampCardSize} Stempel gesammelt.<br />
                Deine neue Karte startet jetzt.
              </div>
              <button onClick={() => setCelebModal(null)} style={styles.btn}>Weiter!</button>
            </div>
          </div>
        )}

        {/* Bonus unlocked */}
        {celebModal && celebModal !== "card" && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 20 }}>
            <div style={{ background: "var(--bg)", borderRadius: 20, padding: "36px 28px", textAlign: "center", maxWidth: 320, width: "100%", border: "1px solid #f59e0b" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f59e0b22", border: "2px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon v={celebModal.icon} size={30} style={{ color: "#f59e0b" }} />
              </div>
              <div style={{ fontSize: 13, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Belohnung freigeschaltet!</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)", marginBottom: 6 }}>{celebModal.name}</div>
              <div style={{ fontSize: 13, color: "var(--fg2)", marginBottom: 24 }}>{celebModal.description}</div>
              <button onClick={() => setCelebModal(null)} style={styles.btn}>OK</button>
            </div>
          </div>
        )}

        {modal === "scan" && (
          <Modal onClose={() => setModal(null)}>
            <QRScannerCamera customers={customers} settings={settings} onScanned={handleScanned} onClose={() => setModal(null)} t={lt} />
          </Modal>
        )}
      </div>
    );
  }

  // ─── EMPLOYEE SCREEN ───────────────────────────────────────────────────────
  if (screen === "employee") {
    const emp = employees.find(e => e.id === activeUser.id);
    const lt = T.de;
    const tabs = [{ id: "scan", label: lt.scan, icon: "fa-solid fa-qrcode" }, { id: "account", label: lt.account, icon: "fa-solid fa-circle-user" }];

    return (
      <div style={{ ...wrapStyle, ...theme }}>
        <>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input:focus { outline: 2px solid var(--accent); } .fa-solid, .fa-regular { font-style: normal; }`}</style>
        </>
        <div style={{ display: "flex", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Header title="Mitarbeiter" sub={activeUser.name} />
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
              {activeTab === "scan" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[["Punkte vergeben", emp?.stats.pointsGiven||0], ["Scans", emp?.stats.scans||0]].map(([l,v]) => (
                      <div key={l} style={{ ...styles.card, textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{v}</div>
                        <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={openScan} style={{ ...styles.btn, marginBottom: 20 }}><i className="fa-solid fa-qrcode" style={{marginRight:6}}></i>Kunden scannen</button>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Letzte Aktivitäten</div>
                  {customers.flatMap(c => c.history.map(h => ({ ...h, custName: c.name||c.username }))).sort((a,b) => b.date.localeCompare(a.date)).slice(0,8).map((h) => (
                    <div key={h.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{h.custName}</div>
                        <div style={{ fontSize: 11, color: "var(--fg2)" }}>{fmtDate(h.date)}</div>
                      </div>
                      <span style={{ ...styles.badge(h.amount >= 0 ? "green" : "red"), fontSize: 12 }}>{h.amount >= 0 ? "+" : ""}{h.amount}P</span>
                    </div>
                  ))}
                  <div style={{ height: 20 }} />
                </>
              )}
              {activeTab === "account" && (
                <>
                  <div style={{ ...styles.card, textAlign: "center", padding: 24, marginBottom: 12 }}>
                    <div style={{ ...styles.avatar(56), margin: "0 auto 12px" }}>{(activeUser.name||"?")[0].toUpperCase()}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--fg)" }}>{activeUser.name}</div>
                    <div style={{ fontSize: 12, color: "var(--fg2)", marginTop: 4 }}>{emp?.role} · {emp?.code}</div>
                  </div>
                  <button onClick={logout} style={{ ...styles.btnDanger, marginBottom: 20 }}><i className="fa-solid fa-right-from-bracket" style={{marginRight:6}}></i>{lt.logout}</button>
                  <div style={{ height: 20 }} />
                </>
              )}
            </div>
            <BottomNav tabs={tabs} active={activeTab} setActive={setActiveTab} />
          </div>
        </div>
        {modal === "scan" && (
          <Modal onClose={() => { setModal(null); setScannedCustomer(null); }}>
            {!scannedCustomer
              ? <QRScannerCamera customers={customers} settings={settings} onScanned={handleScanned} onClose={() => { setModal(null); setScannedCustomer(null); }} t={lt} />
              : scannedMode === "redeem"
                ? <BonusRedeemPanel customer={scannedCustomer} settings={settings} onRedeem={(type,id) => { redeemItem(scannedCustomer.id, type, id, activeUser.id); setScannedCustomer(getCust(scannedCustomer.id)); }} onClose={() => { setModal(null); setScannedCustomer(null); }} t={lt} />
                : <PointSlider customer={scannedCustomer} euroPerPoint={settings.euroPerPoint} onConfirm={pts => addPoints(scannedCustomer.id, pts, activeUser.id)} onClose={() => { setModal(null); setScannedCustomer(null); }} t={lt} />
            }
          </Modal>
        )}
        {modal === "points" && scannedCustomer && (
          <Modal onClose={() => { setModal(null); setScannedCustomer(null); }}>
            <StampOrPointModal
              customer={scannedCustomer}
              settings={settings}
              onStamp={() => {
                const pts = settings.pointsPerStamp || 10;
                const c = getCust(scannedCustomer.id);
                const newStamps = c.stamps + 1;
                const newProg = settings.stampCardMode === "loop" ? newStamps % settings.stampCardSize : newStamps;
                const hitProg = newProg === 0 ? settings.stampCardSize : newProg;
                const unlockedReward = settings.rewards.find(r => r.stamps === hitProg);
                setCustomers(cs => cs.map(cu => {
                  if (cu.id !== c.id) return cu;
                  const newCollected = unlockedReward
                    ? [...(cu.collectedBonuses||[]), { uid: genId(), rewardId: unlockedReward.id, earnedOn: today() }]
                    : (cu.collectedBonuses||[]);
                  return { ...cu, points: cu.points + pts, stamps: newStamps, tier: calcTier(cu.points + pts),
                    collectedBonuses: newCollected,
                    history: [{ id: genId(), date: today(), type: "earn", amount: pts,
                      desc: `+${pts}P – Stempel ${newStamps}${unlockedReward ? ` · ${unlockedReward.name} freigeschaltet!` : ""}`,
                      emp: employees.find(e=>e.id===activeUser.id)?.name||"" }, ...cu.history] };
                }));
                setScannedCustomer(getCust(scannedCustomer.id));
              }}
              onConfirmAmount={pts => { addPoints(scannedCustomer.id, pts, activeUser.id); setModal(null); setScannedCustomer(null); }}
              onClose={() => { setModal(null); setScannedCustomer(null); }}
              t={lt}
            />
          </Modal>
        )}
        {modal === "redeem" && scannedCustomer && (
          <Modal onClose={() => { setModal(null); setScannedCustomer(null); }}>
            <BonusRedeemPanel customer={scannedCustomer} settings={settings} onRedeem={(type,id) => { redeemItem(scannedCustomer.id, type, id, activeUser.id); setScannedCustomer(getCust(scannedCustomer.id)); }} onClose={() => { setModal(null); setScannedCustomer(null); }} t={lt} />
          </Modal>
        )}
      </div>
    );
  }

  // ─── ADMIN SCREEN ──────────────────────────────────────────────────────────
  if (screen === "admin") {
    return (
      <div style={{ ...wrapStyle, ...theme }}>
        <>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } input:focus { outline: 2px solid var(--accent); } input[type=range] { accent-color: var(--accent); } .fa-solid, .fa-regular { font-style: normal; }`}</style>
        </>
        <AdminScreen
          customers={customers} setCustomers={setCustomers}
          employees={employees} setEmployees={setEmployees}
          settings={settings} setSettings={setSettings}
          activeTab={activeTab} setActiveTab={setActiveTab}
          modal={modal} setModal={setModal}
          scannedCustomer={scannedCustomer} setScannedCustomer={setScannedCustomer}
          scannedMode={scannedMode} setScannedMode={setScannedMode}
          addPoints={addPoints} redeemItem={redeemItem}
          activeUser={activeUser} logout={logout}
          handleScanned={handleScanned}
          theme={theme}
        />
      </div>
    );
  }

  return null;
}


// ─── ICON PICKER ──────────────────────────────────────────────────────────────
function IconPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 4 }}>
        {FA_ICON_OPTIONS.map(o => (
          <button key={o.cls} onClick={() => onChange(o.cls)} type="button"
            style={{ padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${value===o.cls ? "var(--accent)" : "var(--border)"}`,
              background: value===o.cls ? "var(--accent-bg)" : "transparent", cursor: "pointer",
              color: value===o.cls ? "var(--accent)" : "var(--fg2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className={o.cls} style={{ fontSize: 16 }}></i>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STAMP OR POINT MODAL ─────────────────────────────────────────────────────
function StampOrPointModal({ customer, settings, onStamp, onConfirmAmount, onClose, t }) {
  const [tab, setTab] = useState("stamp"); // "stamp" | "amount"
  const [stampDone, setStampDone] = useState(false);
  const [lastPts, setLastPts] = useState(0);

  // refresh customer from parent after each stamp
  const pts = settings.pointsPerStamp || 10;

  if (stampDone) return (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{ fontSize: 52, color: "var(--accent)", marginBottom: 14 }}>
        <i className="fa-solid fa-circle-check"></i>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>+{lastPts} {t.points}</div>
      <div style={{ fontSize: 13, color: "var(--fg2)", marginBottom: 28 }}>Stempel {customer.stamps} vergeben</div>
      <button onClick={() => setStampDone(false)} style={{ ...styles.btnSecondary, marginBottom: 10 }}>Weiterer Stempel</button>
      <button onClick={onClose} style={styles.btn}>{t.done}</button>
    </div>
  );

  return (
    <div>
      {/* Customer row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={styles.avatar(44)}>{(customer.name||customer.username||"?")[0].toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{customer.name||customer.username}</div>
          <div style={{ fontSize: 12, color: "var(--fg2)" }}>{customer.points} {t.points} · {customer.stamps} Stempel</div>
        </div>
        <button onClick={onClose} style={{ ...styles.iconBtn, marginLeft: "auto" }}><i className="fa-solid fa-xmark"></i></button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "var(--surface2)", borderRadius: 10, padding: 4 }}>
        {[["stamp","Stempel vergeben"],["amount","Betrag eingeben"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab===id ? "var(--bg)" : "transparent",
              color: tab===id ? "var(--fg)" : "var(--fg3)",
              boxShadow: tab===id ? "0 1px 3px rgba(0,0,0,0.15)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "stamp" && (
        <>
          <StampCard stamps={customer.stamps} settings={settings} onStamp={() => {
            onStamp();
            setLastPts(pts);
            setStampDone(true);
          }} />
          <div style={{ fontSize: 12, color: "var(--fg3)", textAlign: "center", marginTop: 4 }}>
            Leeres Feld antippen → Stempel vergeben (+{pts}P)
          </div>
        </>
      )}

      {tab === "amount" && (
        <PointSlider customer={customer} euroPerPoint={settings.euroPerPoint}
          onConfirm={pts => { onConfirmAmount(pts); }}
          onClose={onClose} t={t} />
      )}
    </div>
  );
}

// ─── ADMIN SCREEN COMPONENT ───────────────────────────────────────────────────
function AdminScreen({ customers, setCustomers, employees, setEmployees, settings, setSettings, activeTab, setActiveTab, modal, setModal, scannedCustomer, setScannedCustomer, scannedMode, setScannedMode, addPoints, redeemItem, activeUser, logout, handleScanned, theme }) {
  const [selectedCust, setSelectedCust] = useState(null);
  const [search, setSearch] = useState("");
  const [editSettings, setEditSettings] = useState(JSON.parse(JSON.stringify(settings)));
  const [empForm, setEmpForm] = useState({ name: "", code: "", role: "", email: "", isAdmin: false });
  const [empError, setEmpError] = useState("");
  const [rewardForm, setRewardForm] = useState({ stamps: "", name: "", icon: "fa-solid fa-id-card", description: "", keepAfterRedeem: false, pointsOnRedeem: 0 });
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", validUntil: "", maxUsage: 100, keepAfterRedeem: false, pointsOnRedeem: 0 });
  const [resetModal, setResetModal] = useState(null);
  const [newPwd, setNewPwd] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [newAccForm, setNewAccForm] = useState({ username: "", name: "" });
  const [newAccResult, setNewAccResult] = useState(null);
  const t = T.de;

  const openScan = () => { setScannedCustomer(null); setScannedMode("normal"); setModal("scan"); };

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "Übersicht", icon: "fa-solid fa-chart-bar" },
    { id: "customers", label: "Kunden", icon: "fa-solid fa-users" },
    { id: "employees", label: "Team", icon: "fa-solid fa-circle-user" },
    { id: "statistics", label: "Statistik", icon: "fa-solid fa-chart-line" },
    { id: "settings", label: "Einst.", icon: "fa-solid fa-gear" },
  ];

  const renderTab = () => {
    // ── OVERVIEW ──
    if (activeTab === "overview") return (
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--fg3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Administrator</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--fg)" }}>{settings.shopName}</div>
          <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
            {[["Kunden", customers.length], ["Mitarbeiter", employees.filter(e=>e.active).length], ["Coupons", settings.coupons.filter(c=>c.active).length]].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--fg2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={openScan} style={{ ...styles.btn, marginBottom: 16 }}><i className="fa-solid fa-qrcode" style={{marginRight:6}}></i>Kunden scannen</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            ["Gesamtpunkte", customers.reduce((s,c)=>s+c.points,0)],
            ["Ø Punkte", Math.round(customers.reduce((s,c)=>s+c.points,0)/(customers.length||1))],
            ["Aktive Kunden", customers.filter(c=>c.history.length>0).length],
            ["Stempel gesamt", customers.reduce((s,c)=>s+c.stamps,0)],
          ].map(([l,v]) => (
            <div key={l} style={{ ...styles.card, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--fg2)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Letzte Transaktionen</div>
        {customers.flatMap(c => c.history.map(h => ({ ...h, custName: c.name||c.username }))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map(h => (
          <div key={h.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{h.custName}</div>
              <div style={{ fontSize: 11, color: "var(--fg2)" }}>{fmtDate(h.date)}{h.emp ? ` · ${h.emp}` : ""}</div>
            </div>
            <span style={{ ...styles.badge(h.amount>=0?"green":"red"), fontSize: 12 }}>{h.amount>=0?"+":""}{h.amount}P</span>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </div>
    );

    // ── CUSTOMERS ──
    if (activeTab === "customers") {
      if (selectedCust) {
        const c = customers.find(cu => cu.id === selectedCust);
        if (!c) return null;
        return (
          <div style={{ padding: "16px 16px 0" }}>
            <button onClick={() => setSelectedCust(null)} style={{ ...styles.btnSecondary, width: "auto", padding: "8px 14px", marginBottom: 16, fontSize: 13 }}><i className="fa-solid fa-arrow-left" style={{marginRight:6}}></i>Zurück</button>
            <div style={{ ...styles.card, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={styles.avatar(50)}>{(c.name||c.username||"?")[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)" }}>{c.name||c.username}</div>
                  <div style={{ fontSize: 12, color: "var(--fg2)" }}>{c.email}</div>
                  <span style={{ ...styles.badge(c.tier==="gold"?"amber":c.tier==="silver"?"blue":""), marginTop: 5, display: "inline-flex" }}>{TIER_CONFIG[c.tier]?.label}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["Punkte", c.points], ["Stempel", c.stamps], ["Käufe", c.history.filter(h=>h.type==="earn").length]].map(([l,v]) => (
                  <div key={l} style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{v}</div>
                    <div style={{ fontSize: 10, color: "var(--fg2)", textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => { setScannedCustomer(c); setScannedMode("normal"); setModal("points"); }} style={{ ...styles.btn, flex: 1 }}><i className="fa-solid fa-plus" style={{marginRight:6}}></i>Punkte</button>
              <button onClick={() => { setScannedCustomer(c); setModal("redeem"); }} style={{ ...styles.btnSecondary, flex: 1 }}>Einlösen</button>
              <button onClick={() => {
                if (window.confirm(`Konto von „${c.name||c.username}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                  setCustomers(cs => cs.filter(cu => cu.id !== c.id));
                  setSelectedCust(null);
                }
              }} style={{ ...styles.btnDanger, flex: "none", width: 44, padding: "12px 10px" }} title="Konto löschen"><i className="fa-solid fa-trash" style={{color:"#ef4444"}}></i></button>
            </div>

            <div style={{ ...styles.card, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Passwort zurücksetzen</div>
              <input placeholder="Neues Passwort" value={resetModal === c.id ? newPwd : ""}
                onChange={e => { setResetModal(c.id); setNewPwd(e.target.value); }}
                type="password" style={{ ...styles.input, marginBottom: 8 }} />
              <button onClick={() => {
                if (!newPwd) return;
                setCustomers(cs => cs.map(cu => cu.id === c.id ? { ...cu, password: newPwd } : cu));
                setNewPwd(""); setResetModal(null);
                alert(`Passwort für „${c.name||c.username}" wurde zurückgesetzt.\nLogin-Name: ${c.name||c.username}`);
              }} style={{ ...styles.btnSecondary, width: "auto", padding: "8px 14px", fontSize: 13 }}>Zurücksetzen</button>
            </div>

            <div style={{ ...styles.card, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Punkte direkt hinzufügen</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                {[10,25,50,100].map(pts => (
                  <button key={pts} onClick={() => {
                    setCustomers(cs => cs.map(cu => cu.id === c.id ? {
                      ...cu, points: cu.points+pts, tier: calcTier(cu.points+pts),
                      history: [{ id: genId(), date: today(), type: "earn", amount: pts, desc: `+${pts}P (Admin)`, emp: "Admin" }, ...cu.history]
                    } : cu));
                  }} style={{ ...styles.chipBtn, ...styles.chipBtnActive }}>+{pts}</button>
                ))}
              </div>
            </div>

            <StampCard stamps={c.stamps} settings={settings} onStamp={() => {
              const pts = settings.pointsPerStamp || 10;
              const newStamps = c.stamps + 1;
              const newProg = settings.stampCardMode === "loop"
                ? newStamps % settings.stampCardSize
                : newStamps;
              const hitProg = newProg === 0 ? settings.stampCardSize : newProg;
              const unlockedReward = settings.rewards.find(r => r.stamps === hitProg);
              setCustomers(cs => cs.map(cu => {
                if (cu.id !== c.id) return cu;
                const newCollected = unlockedReward
                  ? [...(cu.collectedBonuses||[]), { uid: genId(), rewardId: unlockedReward.id, earnedOn: today() }]
                  : (cu.collectedBonuses||[]);
                return {
                  ...cu,
                  points: cu.points + pts,
                  stamps: newStamps,
                  tier: calcTier(cu.points + pts),
                  collectedBonuses: newCollected,
                  history: [{ id: genId(), date: today(), type: "earn", amount: pts,
                    desc: `+${pts}P – Stempel ${newStamps}${unlockedReward ? ` 🎁 ${unlockedReward.name} freigeschaltet!` : ""}`,
                    emp: "Admin" }, ...cu.history]
                };
              }));
            }} />

            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>QR-Code</div>
            <div style={{ ...styles.card, textAlign: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
                <div style={{ background: "#fff", padding: 8, borderRadius: 8 }}>
                  <QRCodeDisplay value={`LOYALTY_${c.id}`} size={120} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 6 }}>LOYALTY_{c.id}</div>
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Verlauf</div>
            {c.history.map(h => (
              <div key={h.id} style={{ ...styles.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{h.desc}</div>
                  <div style={{ fontSize: 11, color: "var(--fg2)" }}>{fmtDate(h.date)}{h.emp ? ` · ${h.emp}` : ""}</div>
                </div>
                <span style={{ ...styles.badge(h.amount>=0?"green":"red"), fontSize: 12 }}>{h.amount>=0?"+":""}{h.amount}P</span>
              </div>
            ))}
            <div style={{ height: 20 }} />
          </div>
        );
      }
      return (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>Kunden ({customers.length})</div>
            <button onClick={() => setCreateModal(true)} style={{ ...styles.btn, width: "auto", padding: "8px 14px", fontSize: 12 }}><i className="fa-solid fa-plus" style={{marginRight:5}}></i>Neu</button>
          </div>
          <input placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...styles.input, marginBottom: 12 }} />
          {filteredCustomers.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--fg3)", fontSize: 13 }}>{t.noResults}</div>}
          {filteredCustomers.map(c => (
            <div key={c.id} onClick={() => setSelectedCust(c.id)} style={{ ...styles.listItem, marginBottom: 8 }}>
              <div style={styles.avatar(42)}>{(c.name||c.username||"?")[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{c.name||c.username}</span>
                  <span style={{ ...styles.badge(c.tier==="gold"?"amber":c.tier==="silver"?"blue":""), fontSize: 10 }}>{TIER_CONFIG[c.tier]?.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.points}P · {c.stamps} · {c.email||c.username}</div>
              </div>
              <span style={{ color: "var(--fg3)", fontSize: 16 }}>›</span>
            </div>
          ))}
          <div style={{ height: 20 }} />
        </div>
      );
    }

    // ── EMPLOYEES ──
    if (activeTab === "employees") return (
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 14 }}>Team ({employees.length})</div>
        {employees.map(e => (
          <div key={e.id} style={{ ...styles.card, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={styles.avatar(42)}>{(e.name||"?")[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>{e.name}</span>
                  <span style={styles.badge(e.active?"green":"red")}>{e.active?t.active:t.inactive}</span>
                  {e.isAdmin && <span style={styles.badge("blue")}>Admin</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2 }}>{e.role} · Code: <strong>{e.code}</strong></div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setEmployees(es => es.map(emp => emp.id===e.id ? { ...emp, active: !emp.active } : emp))}
                  style={{ ...styles.iconBtn, fontSize: 12 }}>{e.active?"⏸":"▶"}</button>
                <button onClick={() => setEmployees(es => es.map(emp => emp.id===e.id ? { ...emp, isAdmin: !emp.isAdmin } : emp))}
                  style={{ ...styles.iconBtn, fontSize: 12 }}><i className="fa-solid fa-star"></i></button>
                <button onClick={() => setEmployees(es => es.filter(emp => emp.id !== e.id))}
                  style={{ ...styles.iconBtn, color: "#ef4444", fontSize: 12 }}><i className="fa-solid fa-xmark"></i></button>
              </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={styles.badge("blue")}><i className="fa-solid fa-qrcode" style={{marginRight:3}}></i>{e.stats.scans} Scans</span>
              <span style={styles.badge("green")}>⭐ {e.stats.pointsGiven}P vergeben</span>
              {e.stats.lastActive && <span style={styles.badge("")}>Zuletzt: {fmtDate(e.stats.lastActive)}</span>}
            </div>
          </div>
        ))}

        <div style={{ ...styles.card, marginTop: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>+ Mitarbeiter hinzufügen</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[["Name","name","text"],["Login-Code","code","text"],["Rolle","role","text"],["E-Mail","email","email"]].map(([l,k,tp]) => (
              <div key={k}>
                <label style={styles.label}>{l}</label>
                <input type={tp} value={empForm[k]||""} onChange={e => setEmpForm(f => ({ ...f, [k]: e.target.value }))} style={{ ...styles.input, marginBottom: 0 }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <input type="checkbox" checked={empForm.isAdmin||false} onChange={e => setEmpForm(f => ({ ...f, isAdmin: e.target.checked }))} id="isAdminChk" />
            <label htmlFor="isAdminChk" style={{ fontSize: 13, color: "var(--fg2)" }}>Admin-Rechte</label>
          </div>
          {empError && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{empError}</div>}
          <button onClick={() => {
            if (!empForm.name||!empForm.code) { setEmpError("Name und Code Pflicht"); return; }
            if (employees.find(e => e.code === empForm.code)) { setEmpError("Code bereits vergeben"); return; }
            setEmployees(es => [...es, { id: genId(), ...empForm, active: true, stats: { scans: 0, pointsGiven: 0, lastActive: null } }]);
            setEmpForm({ name: "", code: "", role: "", email: "", isAdmin: false }); setEmpError("");
          }} style={{ ...styles.btn, marginTop: 12 }}><i className="fa-solid fa-plus" style={{marginRight:6}}></i>Hinzufügen</button>
        </div>
        <div style={{ height: 20 }} />
      </div>
    );

    // ── STATISTICS ──
    if (activeTab === "statistics") {
      const allTx = customers.flatMap(c => c.history.map(h => ({ ...h, custName: c.name||c.username, custId: c.id })));
      const earnTx = allTx.filter(h => h.type === "earn");
      const totalEarned = earnTx.reduce((s,h) => s+h.amount, 0);
      const thisMonth = today().slice(0,7);
      const monthTx = earnTx.filter(h => h.date.startsWith(thisMonth));
      const topCustomers = [...customers].sort((a,b) => b.points - a.points).slice(0,5);
      const tierCounts = { bronze: 0, silver: 0, gold: 0 };
      customers.forEach(c => { tierCounts[c.tier] = (tierCounts[c.tier]||0)+1; });

      return (
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)", marginBottom: 14 }}>Statistiken</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              ["Gesamt-Transaktionen", allTx.length],
              ["Punkte vergeben", totalEarned],
              ["Punkte eingelöst", Math.abs(allTx.filter(h=>h.type==="redeem").reduce((s,h)=>s+h.amount,0))],
              ["Aktionen diesen Monat", monthTx.length],
            ].map(([l,v]) => (
              <div key={l} style={{ ...styles.card, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{v}</div>
                <div style={{ fontSize: 10, color: "var(--fg2)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ ...styles.card, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Status-Verteilung</div>
            {Object.entries(tierCounts).map(([tier, count]) => (
              <div key={tier} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ ...styles.badge(tier==="gold"?"amber":tier==="silver"?"blue":""), fontSize: 11 }}>{TIER_CONFIG[tier]?.label}</span>
                <div style={{ flex: 1, height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count/(customers.length||1))*100}%`, background: tier==="gold"?"#f59e0b":tier==="silver"?"#6b7280":"#b45309", borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 12, color: "var(--fg2)", minWidth: 16 }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ ...styles.card, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Top 5 Kunden</div>
            {topCustomers.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg3)", minWidth: 20 }}>#{i+1}</span>
                <div style={styles.avatar(32)}>{(c.name||"?")[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{c.name||c.username}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{c.points}P</span>
              </div>
            ))}
          </div>

          <div style={{ ...styles.card, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)", marginBottom: 10 }}>Mitarbeiter-Leistung</div>
            {employees.map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={styles.avatar(32)}>{(e.name||"?")[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fg2)" }}>{e.stats.scans} Scans</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{e.stats.pointsGiven}P</span>
              </div>
            ))}
          </div>
          <div style={{ height: 20 }} />
        </div>
      );
    }

    // ── SETTINGS ──
    if (activeTab === "settings") return (
      <div style={{ padding: "16px 16px 0" }}>
        {/* Shop */}
        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Shop-Einstellungen</div>
          <label style={styles.label}>Shop-Name</label>
          <input value={editSettings.shopName||""} onChange={e => setEditSettings(s => ({ ...s, shopName: e.target.value }))} style={{ ...styles.input, marginBottom: 10 }} />
          <label style={styles.label}>Euro pro Punkt (für manuellen Betrag)</label>
          <input type="number" step="0.5" min="0.5" value={editSettings.euroPerPoint} onChange={e => setEditSettings(s => ({ ...s, euroPerPoint: parseFloat(e.target.value)||1 }))} style={{ ...styles.input, marginBottom: 10 }} />
          <label style={styles.label}>Punkte pro Stempel</label>
          <input type="number" step="1" min="1" value={editSettings.pointsPerStamp||10} onChange={e => setEditSettings(s => ({ ...s, pointsPerStamp: parseInt(e.target.value)||10 }))} style={{ ...styles.input, marginBottom: 0 }} />
          <label style={styles.label}>Punkte pro Stempel</label>
          <input type="number" min="1" step="1" value={editSettings.pointsPerStamp||10} onChange={e => setEditSettings(s => ({ ...s, pointsPerStamp: parseInt(e.target.value)||10 }))} style={{ ...styles.input, marginBottom: 0 }} />
        </div>

        {/* Stamp card */}
        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Stempelkarte</div>
          <label style={styles.label}>Modus</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[["loop","Wiederkehrend"],["big","Große Karte"]].map(([v,l]) => (
              <button key={v} onClick={() => setEditSettings(s => ({ ...s, stampCardMode: v }))}
                style={{ ...styles.chipBtn, ...(editSettings.stampCardMode===v ? styles.chipBtnActive : {}), flex: 1 }}>{l}</button>
            ))}
          </div>
          <label style={styles.label}>Stempel pro Runde</label>
          <input type="number" min={5} max={50} value={editSettings.stampCardSize} onChange={e => setEditSettings(s => ({ ...s, stampCardSize: parseInt(e.target.value)||10 }))} style={styles.input} />
        </div>

        {/* Rewards */}
        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Belohnungen</div>
          {editSettings.rewards.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 18 }}><Icon v={r.icon} size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "var(--fg2)" }}>bei {r.stamps} Stempeln · {r.keepAfterRedeem?"bleibt":"einmalig"} · +{r.pointsOnRedeem}P</div>
              </div>
              <button onClick={() => setEditSettings(s => ({ ...s, rewards: s.rewards.filter(rw => rw.id!==r.id) }))}
                style={{ ...styles.iconBtn, color: "#ef4444", fontSize: 12 }}><i className="fa-solid fa-xmark"></i></button>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <label style={styles.label}>Neue Belohnung</label>

            {/* Icon picker full width */}
            <label style={{ ...styles.label, marginBottom: 6 }}>Icon wählen</label>
            <IconPicker value={rewardForm.icon} onChange={v => setRewardForm(r => ({ ...r, icon: v }))} />

            {/* Name + Stempel-Nummer */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 64px", gap: 8, marginBottom: 8, marginTop: 4 }}>
              <div>
                <label style={styles.label}>Name</label>
                <input placeholder="z.B. Gratis Kaffee" value={rewardForm.name} onChange={e => setRewardForm(r => ({ ...r, name: e.target.value }))} style={{ ...styles.input, marginBottom: 0 }} />
              </div>
              <div>
                <label style={styles.label}>Stempel</label>
                <input placeholder="5" type="number" value={rewardForm.stamps} onChange={e => setRewardForm(r => ({ ...r, stamps: e.target.value }))} style={{ ...styles.input, textAlign: "center", marginBottom: 0 }} />
              </div>
            </div>

            <input placeholder="Beschreibung (optional)" value={rewardForm.description} onChange={e => setRewardForm(r => ({ ...r, description: e.target.value }))} style={{ ...styles.input, marginBottom: 8 }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <label style={styles.label}>Punkte beim Einlösen</label>
                <input type="number" min={0} value={rewardForm.pointsOnRedeem} onChange={e => setRewardForm(r => ({ ...r, pointsOnRedeem: parseInt(e.target.value)||0 }))} style={{ ...styles.input, marginBottom: 0 }} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={rewardForm.keepAfterRedeem} onChange={e => setRewardForm(r => ({ ...r, keepAfterRedeem: e.target.checked }))} id="keepRwd" />
                  <label htmlFor="keepRwd" style={{ fontSize: 12, color: "var(--fg2)" }}>Nach Einlösung behalten</label>
                </div>
              </div>
            </div>
            <button onClick={() => {
              if (!rewardForm.name||!rewardForm.stamps) return;
              setEditSettings(s => ({ ...s, rewards: [...s.rewards, { id: genId(), stamps: parseInt(rewardForm.stamps), name: rewardForm.name, icon: rewardForm.icon||"fa-solid fa-gift", description: rewardForm.description, keepAfterRedeem: rewardForm.keepAfterRedeem, pointsOnRedeem: rewardForm.pointsOnRedeem||0 }] }));
              setRewardForm({ stamps: "", name: "", icon: "fa-solid fa-gift", description: "", keepAfterRedeem: false, pointsOnRedeem: 0 });
            }} style={{ ...styles.btnSecondary, fontSize: 13 }}><i className="fa-solid fa-plus" style={{marginRight:6}}></i>Belohnung hinzufügen</button>
          </div>
        </div>

        {/* Coupons */}
        <div style={{ ...styles.card, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 12 }}>Coupons</div>
          {editSettings.coupons.map(c => (
            <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.active?"var(--accent)":"var(--fg3)", letterSpacing: 1 }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: "var(--fg2)", marginTop: 2 }}>{c.discount} · bis {fmtDate(c.validUntil)} · {c.usageCount||0}/{c.maxUsage||"∞"} · {c.keepAfterRedeem?"bleibt":"einmalig"} · +{c.pointsOnRedeem||0}P</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditSettings(s => ({ ...s, coupons: s.coupons.map(cp => cp.id===c.id ? { ...cp, active: !cp.active } : cp) }))}
                    style={{ ...styles.iconBtn, fontSize: 12 }}>{c.active?"⏸":"▶"}</button>
                  <button onClick={() => setEditSettings(s => ({ ...s, coupons: s.coupons.filter(cp => cp.id!==c.id) }))}
                    style={{ ...styles.iconBtn, color: "#ef4444", fontSize: 12 }}><i className="fa-solid fa-xmark"></i></button>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <label style={styles.label}>Neuer Coupon</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["Code","code","text"],["Rabatt","discount","text"],["Gültig bis","validUntil","date"],["Max. Nutzungen","maxUsage","number"]].map(([l,k,tp]) => (
                <div key={k}>
                  <label style={styles.label}>{l}</label>
                  <input type={tp} value={couponForm[k]||""} placeholder={k==="code"?"SOMMER25":k==="discount"?"15%":""} onChange={e => setCouponForm(c => ({ ...c, [k]: k==="code" ? e.target.value.toUpperCase() : k==="maxUsage" ? parseInt(e.target.value)||100 : e.target.value }))} style={{ ...styles.input, marginBottom: 0 }} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div>
                <label style={styles.label}>Punkte beim Einlösen</label>
                <input type="number" min={0} value={couponForm.pointsOnRedeem||0} onChange={e => setCouponForm(c => ({ ...c, pointsOnRedeem: parseInt(e.target.value)||0 }))} style={{ ...styles.input, marginBottom: 0 }} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={couponForm.keepAfterRedeem||false} onChange={e => setCouponForm(c => ({ ...c, keepAfterRedeem: e.target.checked }))} id="keepCp" />
                  <label htmlFor="keepCp" style={{ fontSize: 12, color: "var(--fg2)" }}>Behalten</label>
                </div>
              </div>
            </div>
            <button onClick={() => {
              if (!couponForm.code||!couponForm.discount) return;
              setEditSettings(s => ({ ...s, coupons: [...s.coupons, { id: genId(), ...couponForm, active: true, usageCount: 0 }] }));
              setCouponForm({ code: "", discount: "", validUntil: "", maxUsage: 100, keepAfterRedeem: false, pointsOnRedeem: 0 });
            }} style={{ ...styles.btnSecondary, marginTop: 10, fontSize: 13 }}><i className="fa-solid fa-plus" style={{marginRight:6}}></i>Coupon erstellen</button>
          </div>
        </div>

        <button onClick={() => setSettings(JSON.parse(JSON.stringify(editSettings)))} style={{ ...styles.btn, marginBottom: 8 }}><i className="fa-solid fa-floppy-disk" style={{marginRight:6}}></i>Einstellungen speichern</button>
        <button onClick={logout} style={{ ...styles.btnDanger, marginBottom: 24 }}><i className="fa-solid fa-right-from-bracket" style={{marginRight:6}}></i>Abmelden</button>
        <div style={{ height: 20 }} />
      </div>
    );
  };

  const getCust = (id) => customers.find(c => c.id === id);

  return (
    <div style={{ display: "flex", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Header title="Admin" sub="LoyaltyPass" />
        <div style={{ flex: 1, overflowY: "auto" }}>{renderTab()}</div>
        <BottomNav tabs={tabs} active={activeTab} setActive={setActiveTab} />
      </div>

      {/* Create account modal */}
      {createModal && (
        <Modal onClose={() => { setCreateModal(false); setNewAccResult(null); setNewAccForm({ username: "", name: "" }); }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>Konto erstellen</div>
            <button onClick={() => { setCreateModal(false); setNewAccResult(null); setNewAccForm({ username: "", name: "" }); }} style={styles.iconBtn}><i className="fa-solid fa-xmark"></i></button>
          </div>
          {newAccResult ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}><i className="fa-solid fa-check"></i></div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>Konto erstellt</div>
              <div style={{ ...styles.card, textAlign: "left" }}>
                <div style={{ fontSize: 13, color: "var(--fg2)", marginBottom: 4 }}>Benutzername: <strong style={{ color: "var(--fg)" }}>{newAccResult.username}</strong></div>
                <div style={{ fontSize: 13, color: "var(--fg2)" }}>Passwort: <strong style={{ color: "var(--fg)" }}>{newAccResult.password}</strong></div>
                <div style={{ fontSize: 11, color: "var(--fg3)", marginTop: 6 }}>Der Kunde muss beim ersten Login das Profil vervollständigen.</div>
              </div>
              <button onClick={() => { setCreateModal(false); setNewAccResult(null); setNewAccForm({ username: "", name: "" }); }} style={{ ...styles.btn, marginTop: 16 }}>Fertig</button>
            </div>
          ) : (
            <>
              <label style={styles.label}>Benutzername (wird automatisch generiert)</label>
              <input placeholder="z.B. vorname.nachname (optional)" value={newAccForm.username} onChange={e => setNewAccForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g,"") }))} style={{ ...styles.input, marginBottom: 12 }} />
              <button onClick={() => {
                const uname = newAccForm.username || `user${Math.floor(Math.random()*9000+1000)}`;
                const pwd = `pass${Math.floor(Math.random()*9000+1000)}`;
                if (customers.find(c => c.username === uname)) { alert("Benutzername vergeben"); return; }
                const newC = { id: genId(), username: uname, password: pwd, firstLogin: true, name: "", birthdate: "", email: "", phone: "", points: 0, stamps: 0, memberSince: today(), tier: "bronze", language: "de", darkMode: true, collectedBonuses: [], redeemedCoupons: [], history: [] };
                setCustomers(cs => [...cs, newC]);
                setNewAccResult({ username: uname, password: pwd });
              }} style={styles.btn}>Konto erstellen</button>
            </>
          )}
        </Modal>
      )}

      {modal === "scan" && (
        <Modal onClose={() => { setModal(null); setScannedCustomer(null); }}>
          {!scannedCustomer
            ? <QRScannerCamera customers={customers} settings={settings} onScanned={(c, mode, extra) => { setScannedCustomer(c); setScannedMode(mode||"normal"); setModal(mode==="bonus"||mode==="coupon"?"redeem":"points"); }} onClose={() => { setModal(null); setScannedCustomer(null); }} t={t} />
            : null
          }
        </Modal>
      )}

      {modal === "points" && scannedCustomer && (
        <Modal onClose={() => { setModal(null); setScannedCustomer(null); }}>
          <PointSlider customer={scannedCustomer} euroPerPoint={settings.euroPerPoint} onConfirm={pts => { addPoints(scannedCustomer.id, pts, null); setModal(null); setScannedCustomer(null); }} onClose={() => { setModal(null); setScannedCustomer(null); }} t={t} />
        </Modal>
      )}

      {modal === "redeem" && scannedCustomer && (
        <Modal onClose={() => { setModal(null); setScannedCustomer(null); }}>
          <BonusRedeemPanel customer={scannedCustomer} settings={settings} onRedeem={(type, id) => { redeemItem(scannedCustomer.id, type, id, null); setScannedCustomer(getCust(scannedCustomer.id)); }} onClose={() => { setModal(null); setScannedCustomer(null); }} t={t} />
        </Modal>
      )}
    </div>
  );
}
