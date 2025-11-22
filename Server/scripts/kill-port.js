/**
 * Helper script to kill processes using a specific port
 * Usage: node scripts/kill-port.js [port]
 * Default port: 5000
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const port = process.argv[2] || 5000;

async function killPort(port) {
  try {
    console.log(`Checking for processes using port ${port}...`);
    
    // Find process using the port (Windows)
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    
    if (!stdout || stdout.trim() === '') {
      console.log(`No process found using port ${port}`);
      return;
    }
    
    // Extract PID from netstat output
    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(pid);
      }
    });
    
    if (pids.size === 0) {
      console.log(`No listening process found on port ${port}`);
      return;
    }
    
    console.log(`Found ${pids.size} process(es) using port ${port}:`);
    pids.forEach(pid => console.log(`  - PID: ${pid}`));
    
    // Kill each process
    for (const pid of pids) {
      try {
        await execAsync(`taskkill /PID ${pid} /F`);
        console.log(`✓ Successfully killed process ${pid}`);
      } catch (error) {
        console.error(`✗ Failed to kill process ${pid}:`, error.message);
      }
    }
    
    console.log(`\nPort ${port} is now free. You can start your server.`);
  } catch (error) {
    if (error.message.includes('findstr')) {
      console.log(`No process found using port ${port}`);
    } else {
      console.error('Error:', error.message);
    }
  }
}

killPort(port);

