const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const appRoot = path.resolve(__dirname, '../../../apps/wechat-cloudbase/miniprogram')
const functionsRoot = path.resolve(__dirname, '../../../backend/cloudbase/functions')

function collectJs(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (name !== 'node_modules') collectJs(fullPath, files)
    } else if (name.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

for (const file of collectJs(appRoot).concat(collectJs(functionsRoot))) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status)
}

const contract = spawnSync(process.execPath, [path.join(__dirname, 'verify-release-contract.js')], { stdio: 'inherit' })
process.exit(contract.status)
