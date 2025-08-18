const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://irghpvvoparqettcnpnh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZ2hwdnZvcGFycWV0dGNucG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjI5NjYsImV4cCI6MjA2NjMzODk2Nn0.ElxlmmVG5gcqCwPtTQvGhF1WyDwFG6xaMqktgQY9Hvo'
);

async function listAllCities() {
  try {
    console.log('🔍 Listando todas las ciudades...');
    
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, slug, agenda_eventos_urls')
      .order('name');
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Ciudades encontradas:');
      data.forEach(city => {
        console.log(`- ${city.name} (${city.slug}) - URLs: ${city.agenda_eventos_urls?.length || 0}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listAllCities();
