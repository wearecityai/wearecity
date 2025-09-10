import admin from 'firebase-admin';

// Configuración de Firebase Admin
const serviceAccount = {
    type: "service_account",
    project_id: "wearecity-2ab89",
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'wearecity-2ab89'
    });
}

const auth = admin.auth();
const db = admin.firestore();

async function createTestAdminUser() {
    try {
        console.log('🔧 Creating test admin user...');
        
        // Crear usuario en Auth
        const userRecord = await auth.createUser({
            email: 'admin@test.com',
            password: 'test123456',
            displayName: 'Admin Test'
        });
        
        console.log('✅ User created in Auth:', userRecord.uid);
        
        // Crear perfil en Firestore
        await db.collection('users').doc(userRecord.uid).set({
            email: 'admin@test.com',
            name: 'Admin Test',
            role: 'administrativo',
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ User profile created in Firestore');
        
        // Crear ciudad asociada
        await db.collection('cities').doc('test-city').set({
            name: 'Ciudad Test',
            slug: 'la-vila-joiosa', // Usar el mismo slug que tienen los datos de analytics
            admin_user_id: userRecord.uid,
            assistant_name: 'AsistenteTest',
            system_instruction: '',
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ City created and linked to admin user');
        
        console.log('🎉 Setup complete! You can now login with:');
        console.log('   Email: admin@test.com');
        console.log('   Password: test123456');
        
    } catch (error) {
        console.error('❌ Error creating test admin user:', error);
    }
}

createTestAdminUser();