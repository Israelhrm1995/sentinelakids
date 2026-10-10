// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-hVLXjcgto4fa54ioIbV71tVI4OPoELY",
  authDomain: "buscaseguracrianca.firebaseapp.com",
  projectId: "buscaseguracrianca",
  storageBucket: "buscaseguracrianca.appspot.com",
  messagingSenderId: "70029799548",
  appId: "1:70029799548:web:6f7ae20078af1bbbd099f9",
  measurementId: "G-FFB5JTCW7J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporte os serviços do Firebase que você usará na aplicação
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
