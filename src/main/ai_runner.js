import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn, execSync } from 'node:child_process'
import { BrowserWindow } from 'electron'
import { findCopilotPath } from './helpers/get_copilot_path'
import { getShellPath } from './helpers/getShellpath'
import { findGitPath } from './helpers/getGitPath'
import buildPrompt from './buildPrompt'

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

    let outputBuffer = ''
    let hasMarkedDone = false

    child.stdout.on('data', async (data) => {
      const text = data.toString()
      outputBuffer += text
      mainWindow.webContents.send('executor:stdout', text)

      if (!hasMarkedDone && outputBuffer.includes('<status>done</status>')) {
        hasMarkedDone = true
        await updatePrdIsDone(folderPath, requirement.id, true)
        mainWindow.webContents.send('executor:stdout', '\n--- Requirement marked as done ---')

        const commitResult = await commitRequirementChanges(folderPath, requirement)
        if (commitResult.success) {
          mainWindow.webContents.send('executor:stdout', `\n--- ${commitResult.message} ---`)
        } else {
          mainWindow.webContents.send('executor:stderr', `\n--- Git: ${commitResult.error} ---`)
        }
      }
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send('executor:stderr', text)
    })

    child.on('close', (code, signal) => {
      mainWindow.webContents.send('executor:complete', { code, signal })
    })

    child.on('error', (error) => {
      mainWindow.webContents.send('executor:stderr', `Spawn error: ${error.message}`)
      mainWindow.webContents.send('executor:complete', { code: 1, error: error.message })
    })

    return { success: true }
  } catch (error) {
    console.error('Error executing command:', error)
    return { success: false, error: error.message }
  }
}
