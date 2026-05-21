// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJ3tc4PGhF9bdn8CYFxB_5la02nxfvYq8",
  authDomain: "my-new-project-245e7.firebaseapp.com",
  projectId: "my-new-project-245e7",
  storageBucket: "my-new-project-245e7.firebasestorage.app",
  messagingSenderId: "42176988238",
  appId: "1:42176988238:web:ad4533b59e313b3bb9ef1f",
  measurementId: "G-WVXG598059"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);