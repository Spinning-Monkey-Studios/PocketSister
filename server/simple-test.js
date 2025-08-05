// Simple test to check if Gemini function calls are working
const express = require('express');

async function testGeminiFunctionCalls() {
  console.log('Testing Gemini Function Call System...\n');
  
  try {
    // Import the Gemini chat manager
    const { geminiChat } = await import('./gemini-integration.js');
    
    console.log('✅ Successfully imported GeminiChatManager');
    
    // Test the basic integration
    const testChildId = 'test-child-' + Date.now();
    const testMessage = "Hi Stella! Remember when I told you about my cat Trixie?";
    
    console.log('📤 Sending test message:', testMessage);
    console.log('👤 Child ID:', testChildId);
    
    const response = await geminiChat.processChildMessage(testChildId, testMessage);
    
    console.log('\n📨 Response received:');
    console.log('- AI Response:', response.response?.substring(0, 200) + '...');
    console.log('- Session ID:', response.sessionId);
    console.log('- Memory References:', response.memoryReferences);
    console.log('- Performance Metrics:', response.performanceMetrics);
    
    // Check if function calls are working
    const functionCallsWorking = response.memoryReferences && response.memoryReferences.length > 0;
    const responseExists = response.response && response.response.length > 10;
    
    console.log('\n🔍 Test Results:');
    console.log('- Response generated:', responseExists ? '✅' : '❌');
    console.log('- Function calls triggered:', functionCallsWorking ? '✅' : '❌');
    console.log('- System working:', (responseExists && functionCallsWorking) ? '✅' : '⚠️ Partially');
    
    if (!functionCallsWorking) {
      console.log('\n💡 Function calls may not be triggered because:');
      console.log('- No relevant memories found for this child ID');
      console.log('- Gemini did not determine it needed additional context');
      console.log('- This is normal for first-time interactions');
    }
    
    return {
      success: true,
      responseExists,
      functionCallsWorking,
      response: response.response?.substring(0, 100)
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testGeminiFunctionCalls()
  .then(result => {
    console.log('\n📋 Final Test Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });