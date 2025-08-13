// Paste your Firebase web config below
// Pastikan konfigurasi ini benar
const firebaseConfig = {
  apiKey: "AIzaSyDGNSNL8cX8r2zUC9HdvecoEWcAOOwun9s",
  authDomain: "gallery-tius.firebaseapp.com",
  projectId: "gallery-tius",
  storageBucket: "gallery-tius.appspot.com", // pastikan ini benar, biasanya .appspot.com
  messagingSenderId: "181527784709",
  appId: "1:181527784709:web:871006337e3d9db8945b6c"
};

// Loader untuk Firebase SDK (JANGAN DIUBAH)
(function(){
  const s = document.createElement('script'); s.src='https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js'; // Menggunakan versi 8 (compat)
  s.onload = ()=> {
    const s2 = document.createElement('script'); s2.src='https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
    s2.onload = ()=>{
      const s3 = document.createElement('script'); s3.src='https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js';
      s3.onload = ()=>{ 
          window.firebase.initializeApp(firebaseConfig); 
          window.firebaseApp = window.firebase.app(); 
          window.firebaseAuth = window.firebase.auth(); 
          window.firebaseDB = window.firebase.firestore(); 
      };
      document.head.appendChild(s3);
    };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s);
})();