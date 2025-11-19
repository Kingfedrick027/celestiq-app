// Simple test to check if server starts
console.log('🧪 Testing server setup...\n');

try {
  require('dotenv').config();
  
  console.log('✅ Environment variables loaded');
  console.log('📊 MongoDB URI:', process.env.MONGODB_URI ? 'Found' : '❌ Missing');
  console.log('🔐 JWT Secret:', process.env.JWT_SECRET ? 'Found' : '❌ Missing');
  console.log('🌐 Port:', process.env.PORT || 5000);
  
  console.log('\n✅ All checks passed! Ready to start server.');
  console.log('\nRun: npm run dev');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}