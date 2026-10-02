// modules/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsVFLANWRBu7wszlWEV3cf65eZXfYBnuM",
  authDomain: "losdos-app.firebaseapp.com",
  projectId: "losdos-app",
  storageBucket: "losdos-app.firebasestorage.app",
  messagingSenderId: "634577178524",
  appId: "1:634577178524:web:d73934831ce6d5c04f8259"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
