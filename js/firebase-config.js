// Paste the values from Firebase console → Project settings → Your apps → Web app.
// These are designed to be public; the Firestore rules are what protect the data.
// If apiKey starts with "REPLACE", login and the hall of fame stay switched off
// and the site works exactly as before (open ?demo to preview them with fake data).
export const firebaseConfig = {
  apiKey: "AIzaSyBVF_t7daPbH3n6_uR96AYehNyNFbn9gQ0",
  authDomain: "honeysuckle-81638.firebaseapp.com",
  projectId: "honeysuckle-81638",
  storageBucket: "honeysuckle-81638.firebasestorage.app",
  messagingSenderId: "105620345433",
  appId: "1:105620345433:web:d80656f6d403316898d748",
};

// Google accounts that can manage members and invites.
// Keep in sync with adminEmails() in firestore.rules.
export const adminEmails = ["wolfenfeld@gmail.com"];
