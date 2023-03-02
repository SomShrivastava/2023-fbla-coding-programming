// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
    apiKey: "AIzaSyCEsyb2B_G7hPfmw-Gvga1pHkFNjAQfn60",
    authDomain: "fbla-student-tracker.firebaseapp.com",
    projectId: "fbla-student-tracker",
    storageBucket: "fbla-student-tracker.appspot.com",
    messagingSenderId: "306419117391",
    appId: "1:306419117391:web:c6eafee755e5184a28293a",
    measurementId: "G-R453GX3FJ1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);