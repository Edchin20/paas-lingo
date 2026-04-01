// ═══════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATIE - Paas Lingo
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyBFEqTsDt43Y2KojtpJXPuklCpdHzmk-xM",
  authDomain: "paas-e61d0.firebaseapp.com",
  databaseURL: "https://paas-e61d0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "paas-e61d0",
  storageBucket: "paas-e61d0.firebasestorage.app",
  messagingSenderId: "532887436700",
  appId: "1:532887436700:web:3d40d392b5b67f27eedc59"
};

// ═══════════════════════════════════════════════════════════════
// NIET AANPASSEN HIERONDER
// ═══════════════════════════════════════════════════════════════

const FIREBASE_NOT_CONFIGURED = (
  firebaseConfig.apiKey === "PLAK-HIER-JE-API-KEY" ||
  firebaseConfig.projectId === "JOUW-PROJECT"
);

if (FIREBASE_NOT_CONFIGURED) {
  const showWarning = () => {
    const overlay = document.createElement("div");
    overlay.id = "firebase-warning";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#060F2E;display:flex;align-items:center;justify-content:center;padding:2rem;font-family:Montserrat,sans-serif;color:#fff";
    overlay.innerHTML = `
      <div style="max-width:600px;text-align:center">
        <h1 style="color:#FFD700;font-size:2.2rem;margin-bottom:1rem">Firebase nog niet ingesteld!</h1>
        <p style="color:rgba(255,255,255,.7);margin-bottom:1.5rem;font-size:1.1rem">
          Open het bestand <code style="background:rgba(255,255,255,.15);padding:.2rem .6rem;border-radius:6px;color:#FFD700">js/firebase-config.js</code> en vul je Firebase gegevens in.
        </p>
      </div>
    `;
    document.body.appendChild(overlay);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showWarning);
  } else {
    showWarning();
  }
} else {
  firebase.initializeApp(firebaseConfig);
}

const db = FIREBASE_NOT_CONFIGURED ? null : firebase.database();
