import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize services
// Use the provided firestoreDatabaseId or default to '(default)'
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test as per guidelines
export async function testFirestoreConnection() {
  try {
    // Attempt to fetch a non-existent document from the server to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection test successful.");
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("CRITICAL: Firestore configuration error. The client is offline. Please check your Firebase project settings and ensure Firestore is enabled.");
    } else {
      // Other errors (like permission denied) are fine for a connection test
      console.log("Firestore connection test completed with expected response.");
    }
  }
}
