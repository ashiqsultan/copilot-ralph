import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Get all project files recursively, excluding common build/dependency directories
 * @param {string} folderPath - The root folder path to scan
 * @returns {Promise<{success: boolean, files?: string[], error?: string}>}
 */
export async function getProjectFiles(folderPath) {
  const excludePatterns = [
    // JavaScript/Node.js
    'node_modules', 'dist', 'build', 'out', 'coverage',
    // Java
    'target',
    // .NET
    'bin', 'obj',
    // Python
    '__pycache__', '.venv', 'venv', 'env', '.env', 'pip-wheel-metadata', '.mypy_cache', '.pytest_cache', '.tox', '.eggs', 'site-packages',
    // Ruby
    'vendor', '.bundle',
    // PHP
    'vendor',
    // Go
    'pkg', 'Godeps',
    // Rust
    'target',
    // Elixir
    '_build', 'deps',
    // Haskell
    'dist-newstyle', '.stack-work',
    // C/C++
    'Debug', 'Release', 'x64', 'x86',
    // Dart/Flutter
    '.dart_tool', 'build',
    // General
    '.gradle', '.idea', '.vscode', '.git', '.hg', '.svn', '.DS_Store',
  ]
  
  async function getFilesRecursively(dir, baseDir) {
    const files = []
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relativePath = path.relative(baseDir, fullPath)
        
        if (entry.isDirectory()) {
          // Exclude folders starting with "." or in the exclude patterns list
          if (!entry.name.startsWith('.') && !excludePatterns.includes(entry.name)) {
            const subFiles = await getFilesRecursively(fullPath, baseDir)
            files.push(...subFiles)
          }
        } else {
          files.push(relativePath)
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error)
    }
    return files
  }
  
  try {
    const files = await getFilesRecursively(folderPath, folderPath)
    return { success: true, files: files.sort() }
  } catch (error) {
    console.error('Error getting project files:', error)
    return { success: false, files: [], error: error.message }
  }
}
