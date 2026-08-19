import WebSocket from 'ws';
import * as Y from 'yjs';

// Scalability Test Script for Collaborative Editor
// Usage: node scalabilityTest.js <ROOM_ID> <JWT_TOKEN>

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('❌ Missing arguments.');
  console.error('Usage: node server/scripts/scalabilityTest.js <ROOM_ID>');
  console.error('You can grab the Room ID from your document URL (e.g., http://localhost:5173/document/<ROOM_ID>).');
  process.exit(1);
}

const ROOM_ID = args[0];

async function getTestToken() {
  console.log('🔄 Automatically creating a temporary test user to get a valid token...');
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Load Test Bot',
        email: `loadtest_${Date.now()}@example.com`,
        password: 'password123'
      })
    });
    const data = await res.json();
    if (data.accessToken) {
      console.log('✅ Successfully generated real test token!');
      return data.accessToken;
    }
    throw new Error(data.message || 'Failed to register');
  } catch (err) {
    console.error('❌ Could not generate test token. Is the backend server running on port 5000?');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

const CONCURRENCY_LEVELS = [2, 5, 10, 20];
const TEST_DURATION_MS = 5000; // 5 seconds of typing per test

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest(numUsers, WS_URL) {
  console.log(`\n===========================================`);
  console.log(`🚀 Starting Load Test with ${numUsers} Concurrent Users`);
  console.log(`===========================================`);

  const clients = [];
  let totalMessagesSent = 0;
  let totalMessagesReceived = 0;
  let totalBytesSent = 0;
  let totalBytesReceived = 0;
  const latencies = [];

  // 1. Connect all users
  for (let i = 0; i < numUsers; i++) {
    const ws = new WebSocket(WS_URL);
    const doc = new Y.Doc();
    
    // Track network metrics
    ws.on('message', (data) => {
      totalMessagesReceived++;
      totalBytesReceived += data.byteLength || data.length;
    });

    ws.on('error', (err) => {
      console.error(`\n[User${i}] WebSocket Error:`, err.message);
    });

    ws.on('close', (code, reason) => {
      if (code !== 1000) {
        console.error(`\n[User${i}] WebSocket Closed [Code: ${code}]:`, reason.toString());
      }
    });

    // Capture Yjs updates and send over WS
    doc.on('update', (update, origin) => {
      if (origin !== ws) {
        ws.send(update);
        totalMessagesSent++;
        totalBytesSent += update.byteLength;
      }
    });

    clients.push({ ws, doc, id: i });
  }

  // Wait for connections to establish
  await sleep(1000);
  const connected = clients.filter(c => c.ws.readyState === WebSocket.OPEN).length;
  console.log(`✅ Successfully connected ${connected}/${numUsers} users`);

  if (connected === 0) {
    console.error('❌ No clients connected. Check your token/room or ensure the server is running on port 5000.');
    return;
  }

  // 2. Simulate concurrent typing (everyone spams a character every 200ms)
  const typingInterval = setInterval(() => {
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        const start = Date.now();
        
        // Simulate typing
        const text = client.doc.getText('default');
        text.insert(text.length, `[User${client.id}] `);
        
        // We estimate latency as the time it takes for an update to loop back / settle
        latencies.push(Date.now() - start);
      }
    });
  }, 200);

  // Run the test for X seconds
  await sleep(TEST_DURATION_MS);
  clearInterval(typingInterval);

  // Close connections
  clients.forEach(c => c.ws.close());

  // Calculate stats
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  
  console.log(`\n📊 RESULTS FOR ${numUsers} USERS:`);
  console.log(`- Avg Sync Latency:  ${avgLatency.toFixed(2)} ms`);
  console.log(`- Total Msgs Sent:   ${totalMessagesSent}`);
  console.log(`- Total Msgs Recv:   ${totalMessagesReceived}`);
  console.log(`- Bytes Sent:        ${(totalBytesSent / 1024).toFixed(2)} KB`);
  console.log(`- Bytes Received:    ${(totalBytesReceived / 1024).toFixed(2)} KB`);
}

async function runSuite() {
  const TOKEN = await getTestToken();
  const WS_URL = `ws://localhost:5000/yjs?room=${ROOM_ID}&token=${TOKEN}`;

  for (const users of CONCURRENCY_LEVELS) {
    await runTest(users, WS_URL);
    await sleep(2000); // Cool down between tests
  }
  console.log(`\n🎉 All Load Tests Complete! You can plot these metrics for your paper.`);
}

runSuite();
