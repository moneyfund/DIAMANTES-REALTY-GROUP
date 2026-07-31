import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  documentId,
  serverTimestamp,
  deleteField
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCVL7tpUkyQWz_aVr9wFi2hrCBum2pLnPs',
  authDomain: 'inmo-nicaragua.firebaseapp.com',
  projectId: 'inmo-nicaragua',
  storageBucket: 'inmo-nicaragua.firebasestorage.app',
  messagingSenderId: '735319266898',
  appId: '1:735319266898:web:124c3b886d0eb32a25b18b',
  measurementId: 'G-DXTBSYNR95'
};

const storageBucketUrl = `gs://${firebaseConfig.storageBucket}`;

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
// Configure persistence as soon as Auth is created. Consumers await this promise
// before observing auth state so a still-restoring session is never treated as
// a logout.
const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.info('[Firebase Auth] Persistencia LOCAL configurada.');
  })
  .catch((error) => {
    console.error('[Firebase Auth] No se pudo configurar la persistencia LOCAL.', error);
    throw error;
  });
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app, storageBucketUrl);

export {
  app,
  auth,
  authPersistenceReady,
  provider,
  db,
  storage,
  firebaseConfig,
  storageBucketUrl,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  orderBy,
  documentId,
  serverTimestamp,
  deleteField,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};
