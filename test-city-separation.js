// Test script para verificar separación de conversaciones por ciudad
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCitySeparation() {
  console.log('🧪 Testing city conversation separation...\n');

  // 1. Crear conversaciones para diferentes ciudades
  console.log('1. Creating conversations for different cities...');
  
  const testUserId = 'test-user-123';
  
  // Conversación para La Vila Joiosa
  const { data: vilaConv, error: vilaError } = await supabase
    .from('conversations')
    .insert([{
      user_id: testUserId,
      title: 'Consulta sobre La Vila Joiosa',
      city_slug: 'la-vila-joiosa'
    }])
    .select()
    .single();

  if (vilaError) {
    console.error('❌ Error creating Vila conversation:', vilaError);
  } else {
    console.log('✅ Created Vila conversation:', vilaConv.id);
  }

  // Conversación para Finestrat
  const { data: finestratConv, error: finestratError } = await supabase
    .from('conversations')
    .insert([{
      user_id: testUserId,
      title: 'Consulta sobre Finestrat',
      city_slug: 'finestrat'
    }])
    .select()
    .single();

  if (finestratError) {
    console.error('❌ Error creating Finestrat conversation:', finestratError);
  } else {
    console.log('✅ Created Finestrat conversation:', finestratConv.id);
  }

  // Conversación general (sin ciudad)
  const { data: generalConv, error: generalError } = await supabase
    .from('conversations')
    .insert([{
      user_id: testUserId,
      title: 'Consulta general',
      city_slug: null
    }])
    .select()
    .single();

  if (generalError) {
    console.error('❌ Error creating general conversation:', generalError);
  } else {
    console.log('✅ Created general conversation:', generalConv.id);
  }

  // 2. Verificar separación
  console.log('\n2. Testing conversation separation...');

  // Obtener conversaciones de La Vila Joiosa
  const { data: vilaConversations, error: vilaQueryError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', testUserId)
    .eq('city_slug', 'la-vila-joiosa');

  if (vilaQueryError) {
    console.error('❌ Error querying Vila conversations:', vilaQueryError);
  } else {
    console.log('✅ Vila conversations:', vilaConversations.length);
    vilaConversations.forEach(conv => {
      console.log(`   - ${conv.title} (${conv.id})`);
    });
  }

  // Obtener conversaciones de Finestrat
  const { data: finestratConversations, error: finestratQueryError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', testUserId)
    .eq('city_slug', 'finestrat');

  if (finestratQueryError) {
    console.error('❌ Error querying Finestrat conversations:', finestratQueryError);
  } else {
    console.log('✅ Finestrat conversations:', finestratConversations.length);
    finestratConversations.forEach(conv => {
      console.log(`   - ${conv.title} (${conv.id})`);
    });
  }

  // Obtener conversaciones generales
  const { data: generalConversations, error: generalQueryError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', testUserId)
    .is('city_slug', null);

  if (generalQueryError) {
    console.error('❌ Error querying general conversations:', generalQueryError);
  } else {
    console.log('✅ General conversations:', generalConversations.length);
    generalConversations.forEach(conv => {
      console.log(`   - ${conv.title} (${conv.id})`);
    });
  }

  // 3. Limpiar datos de prueba
  console.log('\n3. Cleaning up test data...');
  
  const { error: cleanupError } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', testUserId);

  if (cleanupError) {
    console.error('❌ Error cleaning up:', cleanupError);
  } else {
    console.log('✅ Test data cleaned up');
  }

  console.log('\n🎉 Test completed!');
}

testCitySeparation().catch(console.error); 