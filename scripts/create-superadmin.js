import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// Configuración de Firebase (usar las mismas credenciales que en la app)
const firebaseConfig = {
  apiKey: "AIzaSyCqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJ",
  authDomain: "wearecity-2ab89.firebaseapp.com",
  projectId: "wearecity-2ab89",
  storageBucket: "wearecity-2ab89.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createSuperAdmin() {
  try {
    console.log('🔐 Creando usuario superadmin...');
    
    // Intentar crear usuario en Firebase Auth
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        'wearecity.ai@gmail.com', 
        'Miaufaelgat0012_1'
      );
      user = userCredential.user;
      console.log('✅ Usuario creado:', user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ El usuario ya existe. Iniciando sesión...');
        const signInCredential = await signInWithEmailAndPassword(
          auth,
          'wearecity.ai@gmail.com',
          'Miaufaelgat0012_1'
        );
        user = signInCredential.user;
        console.log('✅ Usuario existente, iniciada sesión:', user.uid);
      } else {
        throw error;
      }
    }
    
    // Crear/actualizar perfil en Firestore
    const profileData = {
      email: 'wearecity.ai@gmail.com',
      firstName: 'Wearecity',
      lastName: 'SuperAdmin',
      role: 'superadmin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(doc(db, 'profiles', user.uid), profileData, { merge: true });
    console.log('✅ Perfil superadmin creado/actualizado en Firestore');
    
    console.log('🎉 Superadmin configurado exitosamente!');
    console.log('Email: wearecity.ai@gmail.com');
    console.log('Password: Miaufaelgat0012_1');
    console.log('UID:', user.uid);
    
  } catch (error) {
    console.error('❌ Error creando superadmin:', error);
  }
}

createSuperAdmin();