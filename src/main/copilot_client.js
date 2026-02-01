import { CopilotClient } from '@github/copilot-sdk'
import { findCopilotPath } from './helpers/get_copilot_path'

let client = null
let cachedCopilotPath = null

/**
 * Get the Copilot CLI path
 * @returns {string | null}
 */
export function getCopilotPath() {
  if (!cachedCopilotPath) {
    cachedCopilotPath = findCopilotPath()
  }
  return cachedCopilotPath
}

/**
 * Get or create the Copilot SDK client instance
 * @param {string} cliPath - Path to the Copilot CLI
 * @returns {Promise<CopilotClient>}
 */
export async function getCopilotClient(cliPath) {
  if (!client) {
    client = new CopilotClient({
      cliPath: cliPath,
      autoStart: false // We'll start manually when needed
    })
  }
  return client
}

/**
 * Check if Copilot is authenticated by pinging the CLI server
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function checkCopilotStatus() {
  try {
    // First, get the Copilot CLI path
    const cliPath = getCopilotPath()
    
    // Check if the path was found
    if (!cliPath || cliPath === 'copilot') {
      return {
        success: false,
        message: 'GitHub Copilot CLI not found. Please ensure it is installed and available in your PATH.'
      }
    }

    // Create/get client with the CLI path
    const copilotClient = await getCopilotClient(cliPath)
    
    // Start the client if not already started
    const state = copilotClient.getState()
    if (state !== 'connected') {
      await copilotClient.start()
    }

    // Ping the Copilot CLI to verify connection
    const response = await copilotClient.ping('status-check')
    
    return {
      success: true,
      message: `GitHub Copilot is connected`
    }
  } catch (error) {
    // If ping fails, it likely means Copilot is not logged in or CLI is not available
    return {
      success: false,
      message: `GitHub Copilot is not authenticated or CLI is not available: ${error.message}`
    }
  }
}

/**
 * Get list of available models from Copilot
 * @returns {Promise<{success: boolean, models?: Array, message?: string}>}
 */
export async function getAvailableModels() {
  try {
    // Get the Copilot CLI path
    const cliPath = getCopilotPath()
    
    if (!cliPath || cliPath === 'copilot') {
      return {
        success: false,
        message: 'GitHub Copilot CLI not found. Please ensure it is installed and available in your PATH.'
      }
    }

    // Create/get client with the CLI path
    const copilotClient = await getCopilotClient(cliPath)
    
    // Start the client if not already started
    const state = copilotClient.getState()
    if (state !== 'connected') {
      await copilotClient.start()
    }

    // Get the list of models
    const models = await copilotClient.listModels()
    
    return {
      success: true,
      models: models
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to get available models: ${error.message}`
    }
  }
}

/**
 * Clean up the Copilot client
 */
export async function cleanupCopilotClient() {
  if (client) {
    try {
      await client.stop()
    } catch (error) {
      console.error('Error stopping Copilot client:', error)
    }
    client = null
  }
}
