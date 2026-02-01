import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// Get git log with oneline format
export async function getGitLog(folderPath, limit = 50) {
  try {
    const { stdout } = await execAsync(`git log --oneline -n ${limit}`, {
      cwd: folderPath
    })
    return { success: true, logs: stdout.trim() }
  } catch (error) {
    // Check if it's not a git repository
    if (error.message.includes('not a git repository')) {
      return { success: false, error: 'Not a git repository', logs: '' }
    }
    console.error('Error getting git log:', error)
    return { success: false, error: error.message, logs: '' }
  }
}

// Check if folder is a git repository
export async function isGitRepository(folderPath) {
  try {
    await execAsync('git rev-parse --is-inside-work-tree', {
      cwd: folderPath
    })
    return true
  } catch {
    return false
  }
}
