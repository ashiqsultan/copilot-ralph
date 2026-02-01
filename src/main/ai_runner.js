import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn, execSync } from 'node:child_process'
import { BrowserWindow } from 'electron'
import { findCopilotPath } from './helpers/get_copilot_path'
import { getShellPath } from './helpers/getShellpath'
import { findGitPath } from './helpers/getGitPath'
import buildPrompt from './buildPrompt'

// Module-level variable to track the current running process
let currentProcess = null

// ============ Progress.txt Helper Functions ============

// Get the path to progress.txt
function getProgressFilePath(folderPath) {
  return path.join(folderPath, 'progress.txt')
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

// Extract summary from output buffer
function extractSummary(outputBuffer) {
  const summaryMatch = outputBuffer.match(/<summary>([\s\S]*?)<\/summary>/i)
  if (summaryMatch && summaryMatch[1]) {
    return summaryMatch[1].trim()
  }
  return null
}

// ============ End Progress.txt Helper Functions ============

// Helper function to commit changes after requirement completion
async function commitRequirementChanges(folderPath, requirement) {
  const gitPath = findGitPath()
  const shellPath = getShellPath()

  if (!gitPath) {
    console.log("Can't use git - executable not found")
    return { success: false, error: "Can't use git" }
  }

  const execOptions = {
    cwd: folderPath,
    encoding: 'utf8',
    env: { ...process.env, PATH: shellPath },
    timeout: 30000
  }

  try {
    try {
      execSync(`"${gitPath}" rev-parse --git-dir`, execOptions)
    } catch {
      execSync(`"${gitPath}" init`, execOptions)
      console.log('Git repository initialized')
    }

    execSync(`"${gitPath}" add -A`, execOptions)

    try {
      execSync(`"${gitPath}" diff --cached --quiet`, execOptions)
      console.log('No changes to commit')
      return { success: true, message: 'No changes to commit' }
    } catch {
      console.error('something went wrong while commiting')
    }

    const commitMessage = `[${requirement.id}] ${requirement.title}`
    execSync(`"${gitPath}" commit -m "${commitMessage}"`, execOptions)

    console.log(`Committed: ${commitMessage}`)
    return { success: true, message: `Committed: ${commitMessage}` }
  } catch (error) {
    console.error('Error committing changes:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to read prd.json and find requirement by ID
async function getRequirementById(folderPath, requirementId) {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (Array.isArray(prdContent)) {
      return prdContent.find((item) => item.id === requirementId) || null
    }
    return null
  } catch (error) {
    console.error('Error reading requirement:', error)
    return null
  }
}

// Helper function to update requirement isDone status
async function updatePrdIsDone(folderPath, requirementId, isDone) {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (Array.isArray(prdContent)) {
      const index = prdContent.findIndex((item) => item.id === requirementId)
      if (index !== -1) {
        prdContent[index].isDone = isDone
        await fs.writeFile(prdPath, JSON.stringify(prdContent, null, 2), 'utf-8')
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Error updating requirement isDone:', error)
    return false
  }
}

// Helper function to get next incomplete requirement
async function getNextIncompleteRequirement(folderPath) {
  try {
    const prdPath = path.join(folderPath, 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (Array.isArray(prdContent)) {
      return prdContent.find((item) => item.isDone === false) || null
    }
    return null
  } catch (error) {
    console.error('Error getting next requirement:', error)
    return null
  }
}

// Function to execute CLI commands
export async function executeCommand(requirementId, folderPath) {
  try {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) {
      return { success: false, error: 'No window available' }
    }

    if (!folderPath) {
      return { success: false, error: 'No folder path provided' }
    }

    let requirement
    if (requirementId !== null && requirementId !== undefined) {
      requirement = await getRequirementById(folderPath, requirementId)
    } else {
      requirement = await getNextIncompleteRequirement(folderPath)
    }

    if (!requirement) {
      return { success: false, error: 'No requirement found' }
    }

    // TODO: Remove comment
    console.log("requirement",requirement)

    const prompt = buildPrompt(requirement.id, requirement.title, requirement.description)
    const copilotPath = findCopilotPath()
    const shellPath = getShellPath()

    const args = ['--yolo', '--model', 'gpt-4.1', '-i', `"${prompt}"`]

    const child = spawn(copilotPath, args, {
      shell: true,
      cwd: folderPath,
      env: { ...process.env, PATH: shellPath }
    })

    // Store the current process for potential abort
    currentProcess = {
      child,
      requirementId: requirement.id,
      folderPath,
      startTime: Date.now()
    }

    let outputBuffer = ''
    let hasMarkedDone = false
    let hasSavedSummary = false

    child.stdout.on('data', async (data) => {
      const text = data.toString()
      outputBuffer += text
      mainWindow.webContents.send('executor:stdout', text)

      if (!hasMarkedDone && outputBuffer.includes('<status>done</status>')) {
        hasMarkedDone = true
        await updatePrdIsDone(folderPath, requirement.id, true)
        mainWindow.webContents.send('executor:stdout', '\n--- Requirement marked as done ---')
        // Notify frontend to update the UI
        mainWindow.webContents.send('requirement:marked-done', requirement.id)

        const commitResult = await commitRequirementChanges(folderPath, requirement)
        if (commitResult.success) {
          mainWindow.webContents.send('executor:stdout', `\n--- ${commitResult.message} ---`)
        } else {
          mainWindow.webContents.send('executor:stderr', `\n--- Git: ${commitResult.error} ---`)
        }
      }

      // Extract and save summary to progress.txt
      if (!hasSavedSummary && outputBuffer.includes('</summary>')) {
        const summary = extractSummary(outputBuffer)
        if (summary) {
          hasSavedSummary = true
          const summaryWithContext = `[${requirement.id}] ${requirement.title}\n${summary}`
          const appendResult = await appendToProgressFile(folderPath, summaryWithContext)
          if (appendResult.success) {
            mainWindow.webContents.send('executor:stdout', '\n--- Summary saved to progress.txt ---')
          } else {
            mainWindow.webContents.send('executor:stderr', `\n--- Failed to save summary: ${appendResult.error} ---`)
          }
        }
      }
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send('executor:stderr', text)
    })

    child.on('close', (code, signal) => {
      // Clear the current process reference
      if (currentProcess && currentProcess.child === child) {
        currentProcess = null
      }
      mainWindow.webContents.send('executor:complete', { code, signal })
    })

    child.on('error', (error) => {
      // Clear the current process reference on error
      if (currentProcess && currentProcess.child === child) {
        currentProcess = null
      }
      mainWindow.webContents.send('executor:stderr', `Spawn error: ${error.message}`)
      mainWindow.webContents.send('executor:complete', { code: 1, error: error.message })
    })

    return { success: true }
  } catch (error) {
    console.error('Error executing command:', error)
    // Clear the current process reference on exception
    currentProcess = null
    return { success: false, error: error.message }
  }
}

// Function to abort the currently running process
export function abortCurrentProcess() {
  try {
    if (!currentProcess) {
      console.log('No process to abort')
      return { success: false, error: 'No process is currently running' }
    }

    const { child, requirementId } = currentProcess
    
    if (!child || child.killed) {
      currentProcess = null
      return { success: false, error: 'Process already terminated' }
    }

    console.log(`Aborting process for requirement ${requirementId}...`)
    
    // Get main window for sending messages
    const mainWindow = BrowserWindow.getAllWindows()[0]
    
    // Try graceful termination first (SIGTERM)
    const killed = child.kill('SIGTERM')
    
    if (!killed) {
      // If SIGTERM failed, force kill with SIGKILL
      child.kill('SIGKILL')
    }
    
    // Notify frontend about abort
    if (mainWindow) {
      mainWindow.webContents.send('executor:stdout', '\n\n--- Process aborted by user ---\n')
      mainWindow.webContents.send('executor:complete', { 
        code: -1, 
        signal: 'SIGTERM',
        aborted: true 
      })
    }
    
    // Clear the reference
    currentProcess = null
    
    console.log('Process aborted successfully')
    return { success: true, message: 'Process aborted successfully' }
    
  } catch (error) {
    console.error('Error aborting process:', error)
    currentProcess = null
    return { success: false, error: error.message }
  }
}

// Function to check if a process is currently running
export function isProcessRunning() {
  return currentProcess !== null && currentProcess.child && !currentProcess.child.killed
}

// Function to get current process info (for debugging/status)
export function getCurrentProcessInfo() {
  if (!currentProcess) {
    return null
  }
  
  return {
    requirementId: currentProcess.requirementId,
    folderPath: currentProcess.folderPath,
    startTime: currentProcess.startTime,
    running: !currentProcess.child.killed,
    pid: currentProcess.child.pid
  }
}
