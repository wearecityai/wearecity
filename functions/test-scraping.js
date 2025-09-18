const functions = require('firebase-functions');

exports.testIntelligentScraping = functions.https.onCall(async (data, context) => {
  try {
    console.log('🤖 Test: Intelligent Scraping Function Called');
    console.log('📊 Data received:', data);
    
    return {
      success: true,
      message: 'Intelligent scraping function is working!',
      timestamp: new Date().toISOString(),
      data: data
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});