import { execSync } from 'node:child_process';

// Helper function to get the user's shell PATH
export function getShellPath() {
  try {
    if (process.platform === 'win32') {
      return process.env.PATH;
    }

    const shell = process.env.SHELL || '/bin/zsh';
    const shellPath = execSync(`${shell} -ilc 'echo $PATH'`, {
      encoding: 'utf8',
      timeout: 5000
    }).trim();

    return shellPath;
  } catch (error) {
    console.error('Error getting shell PATH:', error);
    return process.env.PATH;
  }
}
