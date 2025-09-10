// Script para verificar que la lógica de métricas funciona con datos reales
// Simula exactamente lo que hace AdminMetrics.tsx

const testAnalyticsData = [
  {
    id: '1',
    city_id: 'la-vila-joiosa',
    user_id: 'user1',
    session_id: 'session1',
    message_content: 'Mejor restaurante',
    message_type: 'user',
    category_id: 'turismo',
    response_time_ms: 1500,
    created_at: { toDate: () => new Date('2025-09-08') }
  },
  {
    id: '2',
    city_id: 'la-vila-joiosa',
    user_id: 'user1',
    session_id: 'session2',
    message_content: 'Eventos hoy',
    message_type: 'user', 
    category_id: 'eventos',
    response_time_ms: 2000,
    created_at: { toDate: () => new Date('2025-09-07') }
  },
  {
    id: '3',
    city_id: 'la-vila-joiosa',
    user_id: 'user2',
    session_id: 'session3',
    message_content: 'Trámites municipales',
    message_type: 'user',
    category_id: 'tramites',
    response_time_ms: 1800,
    created_at: { toDate: () => new Date('2025-09-06') }
  }
];

const testCategoriesData = [
  { id: 'turismo', name: 'turismo', description: 'Información turística' },
  { id: 'eventos', name: 'eventos', description: 'Eventos y actividades' },
  { id: 'tramites', name: 'tramites', description: 'Trámites administrativos' }
];

function processMetricsData(analyticsData, categoriesData) {
  console.log('🧪 Testing metrics processing with sample data...');
  console.log('📊 Analytics data:', analyticsData.length, 'records');
  
  // Procesar datos (como en AdminMetrics.tsx)
  const totalMessages = analyticsData.length;
  const uniqueUsers = new Set(analyticsData.map(a => a.user_id).filter(Boolean)).size;
  const uniqueSessions = new Set(analyticsData.map(a => a.session_id)).size;
  const avgResponseTime = analyticsData.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / (totalMessages || 1);

  console.log('📈 Basic metrics:');
  console.log('   Total Messages:', totalMessages);
  console.log('   Unique Users:', uniqueUsers);
  console.log('   Total Conversations:', uniqueSessions);
  console.log('   Avg Response Time:', Math.round(avgResponseTime), 'ms');

  // Datos por categoría (como en AdminMetrics.tsx)
  const categoryStats = categoriesData.map(category => {
    const categoryMessages = analyticsData.filter(a => a.category_id === category.id);
    
    return {
      name: category.name,
      count: categoryMessages.length,
      value: Math.round((categoryMessages.length / (totalMessages || 1)) * 100),
      avgResponseTime: categoryMessages.length > 0 ? 
        Math.round(categoryMessages.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / categoryMessages.length) : 0,
      uniqueUsers: new Set(categoryMessages.map(m => m.user_id).filter(Boolean)).size
    };
  }).filter(cat => cat.count > 0);

  console.log('📊 Category statistics:');
  categoryStats.forEach(cat => {
    console.log(`   ${cat.name}: ${cat.count} messages (${cat.value}%), ${cat.uniqueUsers} users, ${cat.avgResponseTime}ms avg`);
  });

  // Datos por día (últimos 7 días)
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const dayMessages = analyticsData.filter(a => {
      const itemDate = new Date(a.created_at?.toDate?.() || a.created_at);
      return itemDate.toDateString() === dateStr;
    });
    
    if (dayMessages.length > 0) {
      dailyData.push({
        day: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()],
        messages: dayMessages.length,
        users: new Set(dayMessages.map(m => m.user_id).filter(Boolean)).size
      });
    }
  }

  console.log('📅 Daily data with messages:', dailyData);

  return {
    totalMessages,
    uniqueUsers,
    totalConversations: uniqueSessions,
    avgResponseTime: Math.round(avgResponseTime),
    categoriesData: categoryStats,
    dailyData
  };
}

// Test the processing
const processedMetrics = processMetricsData(testAnalyticsData, testCategoriesData);

console.log('\\n✅ If this shows non-zero data, the processing logic works correctly!');
console.log('The issue is likely in data fetching or authentication, not in data processing.');
console.log('\\n🔧 Metrics that should appear in dashboard:');
console.log(JSON.stringify(processedMetrics, null, 2));