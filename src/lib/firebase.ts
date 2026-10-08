import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust options:
// 1. experimentalForceLongPolling: true - Uses reliable HTTPS POST/GET instead of WebSockets,
//    which prevents proxy disconnects or WebSocket blockage in sandbox / container previews.
// 2. persistentLocalCache: Enables automatic local cache storage with multi-tab support.
// 3. Database ID: Explicitly connect to the provisioned database rather than default '(default)'
const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-vyaparamitra-fc7ae914-4604-493e-bc8c-87159e28c155';

export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  },
  firestoreDbId
);

export const auth = getAuth(app);
