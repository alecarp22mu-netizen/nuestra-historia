// Configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos DOM
const authScreen = document.getElementById('auth-screen');
const pairScreen = document.getElementById('pair-screen');
const mainApp = document.getElementById('main-app');

const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');

const partnerCodeInput = document.getElementById('partner-code-input');
const btnLinkPartner = document.getElementById('btn-link-partner');

const tabMemories = document.getElementById('tab-memories');
const tabNotes = document.getElementById('tab-notes');
const navBtnMemories = document.getElementById('nav-btn-memories');
const navBtnNotes = document.getElementById('nav-btn-notes');

let currentUser = null;
let coupleId = null;

// Control de Sesión
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    checkPairingStatus();
  } else {
    currentUser = null;
    coupleId = null;
    showScreen(authScreen);
  }
});

// Autenticación
btnLogin.addEventListener('click', () => {
  auth.signInWithEmailAndPassword(authEmail.value, authPassword.value)
    .catch(err => alert("Error: " + err.message));
});

btnRegister.addEventListener('click', () => {
  auth.createUserWithEmailAndPassword(authEmail.value, authPassword.value)
    .then(cred => {
      return db.collection('users').doc(cred.user.uid).set({
        email: cred.user.email,
        pairingCode: '82NEST',
        coupleId: null
      });
    })
    .catch(err => alert("Error: " + err.message));
});

btnLogout.addEventListener('click', () => auth.signOut());

// Comprobar Vinculación
function checkPairingStatus() {
  db.collection('users').doc(currentUser.uid).get().then(doc => {
    const data = doc.data();
    if (data && data.coupleId) {
      coupleId = data.coupleId;
      showScreen(mainApp);
      loadMemories();
      loadNotes();
    } else {
      showScreen(pairScreen);
    }
  });
}

// Vincular Pareja
btnLinkPartner.addEventListener('click', () => {
  const code = partnerCodeInput.value.trim().toUpperCase();
  if (!code) return;

  const generatedCoupleId = `couple_${currentUser.uid.substring(0,5)}_${code}`;
  
  db.collection('users').doc(currentUser.uid).update({
    coupleId: generatedCoupleId
  }).then(() => {
    coupleId = generatedCoupleId;
    showScreen(mainApp);
    loadMemories();
    loadNotes();
  });
});

// Cambiar Pantallas
function showScreen(screen) {
  authScreen.classList.add('hidden');
  pairScreen.classList.add('hidden');
  mainApp.classList.add('hidden');
  screen.classList.remove('hidden');
}

// Navegación de Solapas (Tabs)
navBtnMemories.addEventListener('click', () => {
  tabMemories.classList.remove('hidden');
  tabNotes.classList.add('hidden');
  navBtnMemories.className = "flex flex-col items-center gap-1 text-pink-600 font-bold text-xs py-1 px-4";
  navBtnNotes.className = "flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600 font-bold text-xs py-1 px-4";
});

navBtnNotes.addEventListener('click', () => {
  tabNotes.classList.remove('hidden');
  tabMemories.classList.add('hidden');
  navBtnNotes.className = "flex flex-col items-center gap-1 text-pink-600 font-bold text-xs py-1 px-4";
  navBtnMemories.className = "flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600 font-bold text-xs py-1 px-4";
});

// Guardar Recuerdo
document.getElementById('memory-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('memory-title').value;
  const image = document.getElementById('memory-image').value;

  db.collection('couples').doc(coupleId).collection('memories').add({
    title,
    image,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => e.target.reset());
});

// Cargar Recuerdos
function loadMemories() {
  db.collection('couples').doc(coupleId).collection('memories')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const feed = document.getElementById('memories-feed');
      feed.innerHTML = '';
      snapshot.forEach(doc => {
        const item = doc.data();
        feed.innerHTML += `
          <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
            <img src="${item.image}" class="w-full h-48 object-cover">
            <div class="p-3">
              <p class="font-bold text-gray-800 text-sm">${item.title}</p>
            </div>
          </div>
        `;
      });
    });
}

// Guardar Nota
document.getElementById('note-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const content = document.getElementById('note-content').value;

  db.collection('couples').doc(coupleId).collection('notes').add({
    content,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => e.target.reset());
});

// Cargar Notas
function loadNotes() {
  db.collection('couples').doc(coupleId).collection('notes')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const feed = document.getElementById('notes-feed');
      feed.innerHTML = '';
      snapshot.forEach(doc => {
        const item = doc.data();
        feed.innerHTML += `
          <div class="bg-white p-3 rounded-xl shadow-sm border border-pink-100">
            <p class="text-sm text-gray-700">${item.content}</p>
          </div>
        `;
      });
    });
}
