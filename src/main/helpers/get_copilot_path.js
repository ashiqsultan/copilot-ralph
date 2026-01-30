import { execSync } from 'node:child_process';
import { getShellPath } from './getShellpath';

// Helper function to find copilot executable
export function findCopilotPath() {
  try {
    const shellPath = getShellPath();
    const command = process.platform === 'win32' ? 'where copilot' : 'which copilot';

    const result = execSync(command, {
      encoding: 'utf8',
      env: { ...process.env, PATH: shellPath },
      timeout: 5000
    }).trim();

    return process.platform === 'win32' ? result.split('\n')[0] : result;
  } catch (error) {
    console.error('Error finding copilot:', error);
    return 'copilot';
  }
}
