// Paste the values from Firebase console → Project settings → Your apps → Web app.
// These are designed to be public; the Firestore rules are what protect the data.
// While apiKey still starts with "REPLACE", login and the hall of fame stay switched off
// and the site works exactly as before (open ?demo to preview them with fake data).
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.firebasestorage.app",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// Google accounts that can manage members and invites.
// Keep in sync with adminEmails() in firestore.rules.
export const adminEmails = ["wolfenfeld@gmail.com"];
