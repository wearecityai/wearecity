import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (necesitarás agregar las variables de entorno)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCities() {
  console.log('🔍 Verificando ciudades en la base de datos...\n');

  try {
    // Obtener todas las ciudades
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error al obtener ciudades:', error);
      return;
    }

    console.log(`📊 Total de ciudades activas: ${cities.length}\n`);

    if (cities.length === 0) {
      console.log('⚠️  No hay ciudades activas en la base de datos');
      return;
    }

    // Mostrar información de cada ciudad
    cities.forEach((city, index) => {
      console.log(`🏙️  Ciudad ${index + 1}:`);
      console.log(`   Nombre: ${city.name}`);
      console.log(`   Slug: ${city.slug}`);
      console.log(`   Pública: ${city.is_public ? '✅ Sí' : '❌ No'}`);
      console.log(`   Activa: ${city.is_active ? '✅ Sí' : '❌ No'}`);
      console.log(`   Admin: ${city.admin_user_id}`);
      console.log(`   URL: ${process.env.VITE_APP_URL || 'http://localhost:3000'}/chat/${city.slug}`);
      console.log('');
    });

    // Verificar ciudades públicas
    const publicCities = cities.filter(city => city.is_public);
    console.log(`🌐 Ciudades públicas: ${publicCities.length}/${cities.length}`);

    if (publicCities.length > 0) {
      console.log('\n🔗 URLs de ciudades públicas:');
      publicCities.forEach(city => {
        console.log(`   ${process.env.VITE_APP_URL || 'http://localhost:3000'}/chat/${city.slug}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCities(); 