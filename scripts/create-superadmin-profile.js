// Script para crear el perfil superadmin en Firestore
// Este script asume que el usuario wearecity.ai@gmail.com ya existe en Firebase Auth

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

async function createSuperAdminProfile() {
  try {
    console.log('🔐 Iniciando sesión con wearecity.ai@gmail.com...');
    
    // Iniciar sesión con el usuario existente
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'wearecity.ai@gmail.com',
      'Miaufaelgat0012_1'
    );
    
    const user = userCredential.user;
    console.log('✅ Usuario autenticado:', user.uid);
    
    // Crear perfil superadmin en Firestore
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
    console.log('Rol: superadmin');
    
  } catch (error) {
    console.error('❌ Error configurando superadmin:', error);
  }
}

createSuperAdminProfile();
