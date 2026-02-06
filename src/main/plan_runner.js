import path from 'node:path'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { BrowserWindow } from 'electron'
import { findCopilotPath } from './helpers/get_copilot_path'
import { getShellPath } from './helpers/getShellpath'
import { getPrdExecutorModel } from './helpers/store'
import buildPlanPrompt from './buildPlanPrompt'

let currentPlanProcess = null

// Extract JSON plan array from LLM output, handling markdown fences and extra text
// Expected format: [{id: number, plan: string}, ...]
function extractPlanJson(outputBuffer) {
  console.log(" ========= outputBuffer")
  console.log(outputBuffer)

  // Try markdown code fence
  const fenceMatch = outputBuffer.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim())
    } catch {
      // fall through
    }
  }

  // Try raw JSON array
  const arrayMatch = outputBuffer.match(/\[[\s\S]*\]/)
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0])
    } catch {
      // fall through
    }
  }

  return null
}

// Update prd.json items with plan details from array [{id, plan}, ...]
async function updatePrdWithPlans(folderPath, plans) {
  try {
    const prdPath = path.join(folderPath, '.copilot_ralph', 'prd.json')
    const content = await fs.readFile(prdPath, 'utf-8')
    const prdContent = JSON.parse(content)

    if (!Array.isArray(prdContent)) {
      return { success: false, error: 'prd.json is not an array' }
    }

    // Build a lookup map from the plans array: id -> plan
    const planMap = new Map()
    for (const p of plans) {
      planMap.set(p.id, p.plan)
    }

    let updated = 0
    for (const item of prdContent) {
      if (planMap.has(item.id)) {
        item.plan = planMap.get(item.id)
        updated++
      }
    }

    await fs.writeFile(prdPath, JSON.stringify(prdContent, null, 2), 'utf-8')
    return { success: true, updated }
  } catch (error) {
    console.error('Error updating prd.json with plans:', error)
    return { success: false, error: error.message }
  }
}

export async function executePlan(folderPath) {
  try {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) {
      return { success: false, error: 'No window available' }
    }

    if (!folderPath) {
      return { success: false, error: 'No folder path provided' }
    }

    // Read full prd.json
    const prdPath = path.join(folderPath, '.copilot_ralph', 'prd.json')
    let prdRawContent
    try {
      prdRawContent = await fs.readFile(prdPath, 'utf-8')
      // console.log("===== prdRawContent =====")
      // console.log(prdRawContent)
      JSON.parse(prdRawContent) // validate it's valid JSON
    } catch (error) {
      mainWindow.webContents.send('planner:stderr', `Failed to read prd.json: ${error.message}\n`)
      mainWindow.webContents.send('planner:complete', { code: 1, error: 'Failed to read prd.json' })
      return { success: false, error: 'Failed to read prd.json' }
    }

    const prompt = buildPlanPrompt(prdRawContent)
    const copilotPath = findCopilotPath()
    const shellPath = getShellPath()

    const selectedModel = getPrdExecutorModel()
    if (!selectedModel) {
      mainWindow.webContents.send(
        'planner:stderr',
        'No model selected. Please select a model from the Model Selector before running.\n'
      )
      mainWindow.webContents.send('planner:complete', { code: 1, error: 'No model selected' })
      return {
        success: false,
        error: 'No model selected. Please select a model from the Model Selector.'
      }
    }

    const args = ['--yolo', '--no-auto-update', '--model', selectedModel]

    const child = spawn(copilotPath, args, {
      shell: true,
      cwd: folderPath,
      env: { ...process.env, PATH: shellPath }
    })

    child.stdin.write(prompt)
    child.stdin.end()

    currentPlanProcess = {
      child,
      folderPath,
      startTime: Date.now()
    }

    let outputBuffer = ''

    child.stdout.on('data', (data) => {
      const text = data.toString()
      outputBuffer += text
      mainWindow.webContents.send('planner:stdout', text)
    })

    child.stderr.on('data', (data) => {
      const text = data.toString()
      mainWindow.webContents.send('planner:stderr', text)
    })

    child.on('close', async (code, signal) => {
      if (currentPlanProcess && currentPlanProcess.child === child) {
        currentPlanProcess = null
      }

      // Parse and save plans on successful completion
      if (code === 0) {
        const plans = extractPlanJson(outputBuffer)
        if (Array.isArray(plans) && plans.length > 0) {
          const result = await updatePrdWithPlans(folderPath, plans)
          if (result.success) {
            mainWindow.webContents.send(
              'planner:stdout',
              `\n--- Plans saved to prd.json (${result.updated} items updated) ---\n`
            )
            mainWindow.webContents.send('planner:plans-saved', plans)
          } else {
            mainWindow.webContents.send(
              'planner:stderr',
              `\n--- Failed to save plans: ${result.error} ---\n`
            )
          }
        } else {
          mainWindow.webContents.send(
            'planner:stderr',
            '\n--- Could not parse plan JSON from output ---\n'
          )
        }
      }

      mainWindow.webContents.send('planner:complete', { code, signal })
    })

    child.on('error', (error) => {
      if (currentPlanProcess && currentPlanProcess.child === child) {
        currentPlanProcess = null
      }
      mainWindow.webContents.send('planner:stderr', `Spawn error: ${error.message}`)
      mainWindow.webContents.send('planner:complete', { code: 1, error: error.message })
    })

    return { success: true }
  } catch (error) {
    console.error('Error executing plan:', error)
    currentPlanProcess = null
    return { success: false, error: error.message }
  }
}

export function abortPlanProcess() {
  try {
    if (!currentPlanProcess) {
      return { success: false, error: 'No planning process is currently running' }
    }

    const { child } = currentPlanProcess

    if (!child || child.killed) {
      currentPlanProcess = null
      return { success: false, error: 'Process already terminated' }
    }

    console.log('Aborting planning process...')

    const mainWindow = BrowserWindow.getAllWindows()[0]

    const killed = child.kill('SIGTERM')
    if (!killed) {
      child.kill('SIGKILL')
    }

    if (mainWindow) {
      mainWindow.webContents.send(
        'planner:stdout',
        '\n\n--- Planning process aborted by user ---\n'
      )
      mainWindow.webContents.send('planner:complete', {
        code: -1,
        signal: 'SIGTERM',
        aborted: true
      })
    }

    currentPlanProcess = null
    return { success: true, message: 'Planning process aborted successfully' }
  } catch (error) {
    console.error('Error aborting planning process:', error)
    currentPlanProcess = null
    return { success: false, error: error.message }
  }
}

export function isPlanRunning() {
  return currentPlanProcess !== null && currentPlanProcess.child && !currentPlanProcess.child.killed
}
