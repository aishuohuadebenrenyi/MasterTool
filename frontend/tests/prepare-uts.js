const fs = require('fs')
const path = require('path')

const SRC_DIR = path.join(__dirname, '..')
const TEST_DIR = path.join(__dirname, '__uts_mirror__')

const UTS_TYPES = new Set([
  'string', 'number', 'boolean', 'void', 'any', 'null', 'undefined',
  'Date', 'RegExp', 'Array', 'Map', 'Set', 'Promise',
  'UTSJSONObject', 'TimerOptions', 'SwipeOptions', 'TodoItem',
  'RequestOptions', 'ValidationResult', 'PlanValidateResult',
])

function stripUTSSyntax(code) {
  let lines = code.split('\n')
  let result = []
  let skipBlock = false
  let braceDepth = 0

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    if (skipBlock) {
      braceDepth += (line.match(/\{/g) || []).length
      braceDepth -= (line.match(/\}/g) || []).length
      if (braceDepth <= 0) {
        skipBlock = false
        braceDepth = 0
      }
      continue
    }

    if (/^\s*(export\s+)?type\s+\w+\s*=/.test(line)) {
      if (!line.includes('{') || (line.match(/\{/g) || []).length === (line.match(/\}/g) || []).length) {
        continue
      }
      skipBlock = true
      braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      continue
    }

    if (/^\s*import\s/.test(line)) {
      result.push(line)
      continue
    }

    if (/^\s*(export\s+)?function\s/.test(line) || /^\s*function\s/.test(line)) {
      line = stripFunctionTypes(line)
    }

    if (/^\s*(export\s+)?(let|const|var)\s/.test(line)) {
      line = stripVarTypes(line)
    }

    let prevLine = ''
    while (prevLine !== line) {
      prevLine = line
      line = line.replace(/<Array<UTSJSONObject>>/g, '')
      line = line.replace(/<UTSJSONObject\s*\|\s*\w+>/g, '')
      line = line.replace(/<UTSJSONObject>/g, '')
      line = line.replace(/<string>/g, '')
      line = line.replace(/<number>/g, '')
      line = line.replace(/<boolean>/g, '')
      line = line.replace(/<\w+\s*\|\s*\w+>/g, '')
      line = line.replace(/<\w+>/g, '')
    }

    line = line.replace(/\b(as)\s+\w+(\[\])?/g, '')

    result.push(line)
  }

  return result.join('\n')
}

function stripFunctionTypes(line) {
  line = line.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*\w+(\s*\|\s*\w+)*\s*\{/, (match, name, params) => {
    return `function ${name}(${stripParamTypes(params)}) {`
  })
  line = line.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*:\s*\w+(\s*\|\s*\w+)*\s*=>/, (match, name, params) => {
    return `function ${name}(${stripParamTypes(params)}) =>`
  })
  line = line.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{/, (match, name, params) => {
    return `function ${name}(${stripParamTypes(params)}) {`
  })
  line = line.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*=/, (match, name, params) => {
    return `function ${name}(${stripParamTypes(params)}) =`
  })
  return line
}

function stripParamTypes(params) {
  let depth = 0
  let result = ''
  let i = 0
  while (i < params.length) {
    const ch = params[i]
    if (ch === '(' || ch === '[' || ch === '{' || ch === '<') depth++
    if (ch === ')' || ch === ']' || ch === '}' || ch === '>') depth--
    if (ch === ':' && depth === 0) {
      let j = i + 1
      while (j < params.length) {
        const nc = params[j]
        if (nc === ',' || nc === ')') break
        if (nc === '=' && depth === 0) break
        if (nc === '(' || nc === '[' || nc === '{' || nc === '<') depth++
        if (nc === ')' || nc === ']' || nc === '}' || nc === '>') {
          depth--
          if (depth < 0) break
        }
        j++
      }
      i = j
      continue
    }
    result += ch
    i++
  }
  return result.replace(/,\s*,/g, ',').replace(/\(\s*,/g, '(').replace(/,\s*\)/g, ')')
}

function stripVarTypes(line) {
  return line.replace(/(export\s+)?(let|const|var)\s+(\w+)\s*:\s*[^=;\n]+(=)/g, '$1$2 $3 $4')
}

function processDirectory(dir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(dir, entry.name)
    const tgtPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name !== 'static' && entry.name !== 'pages' && entry.name !== 'components' && entry.name !== 'node_modules' && entry.name !== 'tests' && entry.name !== 'unpackage' && entry.name !== '.hbuilderx') {
        processDirectory(srcPath, tgtPath)
      }
    } else if (entry.name.endsWith('.uts')) {
      const jsName = entry.name.replace('.uts', '.js')
      const jsPath = path.join(targetDir, jsName)
      const code = fs.readFileSync(srcPath, 'utf-8')
      const transformed = stripUTSSyntax(code)
      fs.writeFileSync(jsPath, transformed)
    }
  }
}

if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true })
}

processDirectory(SRC_DIR, TEST_DIR)
console.log('UTS → JS mirror created at tests/__uts_mirror__/')
