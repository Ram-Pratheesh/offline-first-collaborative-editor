# Experimental Testing Guide

This guide outlines exactly how to manually trigger and verify each of the core edge cases for your CRDT-based Collaborative Editor. These scenarios prove the resilience, consistency, and offline capabilities of your system for your paper.

> [!TIP]
> Before running these tests, open the **Diagnostics Panel** in the editor toolbar to watch the real-time metrics (Consistency Rate, Sync Latency, etc.) react to your actions.

---

### 1. Two users editing simultaneously
- **What to do:** Open the same document in two side-by-side browser windows (use an Incognito window for the second one). Type continuously in Window A, and then type in Window B.
- **Expected Output:** Both screens update in real-time (usually under 50ms). The **Document Consistency** in the Diagnostics panel should remain at `CONSISTENT (100%)`. You should see the other person's colored cursor moving smoothly.

### 2. Multiple concurrent edits
- **What to do:** In Window A and Window B, type at the exact same time in different paragraphs.
- **Expected Output:** Yjs (your CRDT engine) merges both changes seamlessly without any locking or jumping cursors. No text is overwritten or lost.

### 3. User going offline while editing
- **What to do:** In Window A, disconnect from the internet (or use Chrome DevTools -> Network -> set throttling to "Offline"). Type a new paragraph: *"This was written offline."*
- **Expected Output:** You can continue typing smoothly without any "Connecting..." freezing. The Diagnostics panel will show **Internet: OFFLINE**, **WebSocket: DISCONNECTED**, and **Sync Status: OFFLINE**.

### 4. Multiple users going offline
- **What to do:** Have both Window A and Window B go offline. In Window A, type "Apple". In Window B, type "Banana". 
- **Expected Output:** Both users can type in complete isolation. The Document Consistency will change to `DIVERGENT` because their local states no longer match.

### 5. Reconnection and automatic synchronization
- **What to do:** Following Test #4, reconnect Window A and Window B to the internet.
- **Expected Output:** Within a fraction of a second, Window A will see "Banana", and Window B will see "Apple". The CRDT algorithm will mathematically merge the offline branches. The Document Consistency will instantly jump back to `CONSISTENT (100%)`.

### 6. Browser refresh while offline
- **What to do:** Go offline. Type some new text. Refresh the browser page (`F5`).
- **Expected Output:** Because of your `y-indexeddb` persistence layer, the text you wrote while offline **will still be there** when the page reloads.

### 7. Closing/reopening while offline
- **What to do:** Go offline. Type text. completely close the browser tab. Open a new tab and navigate back to the `localhost:5173/document/<ID>` URL.
- **Expected Output:** The document loads immediately from the local IndexedDB storage, preserving the offline edits perfectly before it even attempts to contact the server.

### 8. Network interruption during synchronization
- **What to do:** Type a massive block of text and repeatedly toggle your Wi-Fi off and on rapidly while typing.
- **Expected Output:** The WebSocket will sever and reconnect constantly. No keystrokes will be lost. The metrics dashboard will show the **Messages Sent/Received** jumping up every time a connection is re-established as it flushes the buffered operations.

### 9. Multiple users editing the same area
- **What to do:** Open two windows. Have User A and User B place their cursors on the exact same word. User A types "Hello ", and User B types "World" simultaneously.
- **Expected Output:** Instead of crashing or throwing a "Conflict" error, Yjs resolves the conflict deterministically (e.g., it will output "Hello World" or "World Hello" identically on both screens). 

### 10. Increasing number of users for scalability
- **What to do:** Run your new Node.js load testing script: `node server/scripts/scalabilityTest.js <ROOM_ID>`.
- **Expected Output:** The terminal will output performance metrics for 2, 5, 10, and 20 concurrent users. You will expect to see the **Average Sync Latency** slowly increase linearly as the number of users goes up, proving the server can handle high loads gracefully.

### 11. Different documents/rooms remaining isolated
- **What to do:** Open `Document 1` in Window A. Open `Document 2` (a different URL) in Window B. Type in both.
- **Expected Output:** Neither document receives the other's text. The server's WebSocket router correctly partitions traffic based on the `?room=` parameter.
