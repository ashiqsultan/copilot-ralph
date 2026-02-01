import path from 'node:path'
import fs from 'node:fs/promises'

// Get the path to progress.txt
function getProgressFilePath(folderPath) {
  return path.join(folderPath, '.copilot_ralph', 'progress.txt')
}

// Read progress.txt content, returns empty string if file doesn't exist
export async function readProgressFile(folderPath) {
  try {
    const progressPath = getProgressFilePath(folderPath)
    const content = await fs.readFile(progressPath, 'utf-8')
    return content
  } catch (error) {
    if (error.code === 'ENOENT') {
      return ''
    }
    console.error('Error reading progress.txt:', error)
    return ''
  }
}

// Create progress.txt if it doesn't exist
export async function createProgressFile(folderPath, initialContent = '') {
  try {
    const copilotRalphDir = path.join(folderPath, '.copilot_ralph')
    await fs.mkdir(copilotRalphDir, { recursive: true })
    const progressPath = getProgressFilePath(folderPath)
    await fs.writeFile(progressPath, initialContent, { flag: 'wx', encoding: 'utf-8' })
    return { success: true }
  } catch (error) {
    if (error.code === 'EEXIST') {
      return { success: true, message: 'File already exists' }
    }
    console.error('Error creating progress.txt:', error)
    return { success: false, error: error.message }
  }
}

// Append content to progress.txt, creates file if it doesn't exist
export async function appendToProgressFile(folderPath, content) {
  try {
    const copilotRalphDir = path.join(folderPath, '.copilot_ralph')
    await fs.mkdir(copilotRalphDir, { recursive: true })
    const progressPath = getProgressFilePath(folderPath)
    const timestamp = new Date().toISOString()
    const formattedContent = `\n---\n[${timestamp}]\n${content}\n`
    await fs.appendFile(progressPath, formattedContent, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error appending to progress.txt:', error)
    return { success: false, error: error.message }
  }
}

// Clear progress.txt content
export async function clearProgressFile(folderPath) {
  try {
    const copilotRalphDir = path.join(folderPath, '.copilot_ralph')
    await fs.mkdir(copilotRalphDir, { recursive: true })
    const progressPath = getProgressFilePath(folderPath)
    await fs.writeFile(progressPath, '', 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error clearing progress.txt:', error)
    return { success: false, error: error.message }
  }
}

// Check if progress.txt exists
export async function progressFileExists(folderPath) {
  try {
    const progressPath = getProgressFilePath(folderPath)
    await fs.access(progressPath)
    return true
  } catch {
    return false
  }
}
