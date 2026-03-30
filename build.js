const esbuild = require('esbuild')
const babel = require('@babel/core')
const { globSync } = require('glob')
const path = require('path')
const fs = require('fs')

const isWatch = process.argv.includes('--watch')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function cleanGeneratedOutput() {
  ensureDir('dist')
  const generatedDirs = ['dist/server_scripts', 'dist/client_scripts', 'dist/startup_scripts']
  for (const dir of generatedDirs) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
  }
}

function resolveOutDir(fileName) {
  if (fileName.startsWith('server.')) return 'dist/server_scripts'
  if (fileName.startsWith('client.')) return 'dist/client_scripts'
  if (fileName.startsWith('startup.')) return 'dist/startup_scripts'
  return null
}

function resolveOutFileName(fileName) {
  return fileName.replace(/^(server|client|startup)\./, '').replace(/\.ts$/, '.js')
}

function collectEntryPoints() {
  const files = globSync('src/**/*.ts', { windowsPathsNoEscape: true })
  return files.map(file => {
    const fileName = path.basename(file)
    const outDir = resolveOutDir(fileName)
    if (!outDir) return null
    return { entry: file, outDir, outFileName: resolveOutFileName(fileName) }
  }).filter(Boolean)
}

async function buildOnce() {
  const entries = collectEntryPoints()
  if (entries.length === 0) return

  for (const item of entries) {
    ensureDir(item.outDir)
    const outfile = path.join(item.outDir, item.outFileName)

    try {
      // STEP 1: esbuild only bundles (gathers everything into one file)
      const esbuildResult = await esbuild.build({
        entryPoints: [item.entry],
        bundle: true,
        write: false,
        platform: 'neutral',
        mainFields: ['module', 'main'],
        format: 'iife',
        globalName: 'bundle', // Wraps in global name to avoid conflicts
        
        // [FIX] Don't force esbuild to do Babel's job!
        // Use modern target so it doesn't complain about classes and const
        target: 'esnext', 

        treeShaking: true,
        sourcemap: false,
        logLevel: 'info',
      })

      const rawCode = esbuildResult.outputFiles[0]?.text
      if (!rawCode) throw new Error(`No build output produced for ${item.entry}`)

      // STEP 2: Babel does the heavy lifting - transpiling code to ES5 for Rhino
      const babelResult = await babel.transformAsync(rawCode, {
        presets: [
          ['@babel/preset-env', {
            targets: { ie: '11' }, // This forces Babel to rewrite classes, const, let, etc.
            loose: true,
            modules: false,
          }],
        ],
        plugins: [
          // TSyringe metadata
          'babel-plugin-transform-typescript-metadata',
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
          
          // [FIX] Fix "invalid object initializer" in Rhino
          '@babel/plugin-transform-shorthand-properties',
          '@babel/plugin-transform-computed-properties',
          '@babel/plugin-transform-arrow-functions',
          
          // [FIX] Force simplify loops and spreads for Rhino
          ['@babel/plugin-transform-spread', { loose: true }],
          ['@babel/plugin-transform-for-of', { loose: true }],
          ['@babel/plugin-transform-destructuring', { loose: true }],
          
          ['@babel/plugin-transform-classes', { loose: true }],
          ['@babel/plugin-transform-parameters', { loose: true }],
          ['@babel/plugin-transform-block-scoping', { throwIfClosureRequired: false }]
        ],
        configFile: false,
        babelrc: false,
        comments: false, // Remove comments to reduce size
        compact: false,
      })

      let finalCode = babelResult?.code ?? rawCode

      // --- ULTIMATE RHINO SAFETY PATCHES (KubeJS) ---

      // 1. SAFE PATCH FOR LOOPS (Fixes _i is not defined and _step is not defined)
      // Replace function declaration to accept arguments
      finalCode = finalCode.replace(
        /var\s+(_loop\d*)\s*=\s*function\s+\1\s*\(\)\s*\{/g,
        'var $1 = function $1(_step, _i, _i2, _i3, _i4) {'
      );
      
      // Replace function call, passing variables only if they exist
      // This prevents ReferenceError
      finalCode = finalCode.replace(
        /(_loop\d*)\(\);/g,
        '$1(typeof _step !== "undefined" ? _step : undefined, typeof _i !== "undefined" ? _i : undefined, typeof _i2 !== "undefined" ? _i2 : undefined, typeof _i3 !== "undefined" ? _i3 : undefined, typeof _i4 !== "undefined" ? _i4 : undefined);'
      );

      // 2. Fix tslib ("ar is not defined" error)
      finalCode = finalCode.replace(
        /var\s+i\s*=\s*m\.call\(o\);\s*var\s+r;\s*var\s+ar\s*=\s*\[\];\s*var\s+e;/g, 
        'var i = m.call(o); var r; var e; var ar; ar = [];'
      );

      // 2. Fix __spread2 function (tslib) - extract ar from for loop header
      // ERROR: for (var ar = [], i = 0; ...) 
      // PATCH: var ar = []; for (var i = 0; ...)
      finalCode = finalCode.replace(
        /for\s*\(var\s+ar\s*=\s*\[\],\s*i\s*=\s*0;\s*i\s*<\s*arguments\.length;\s*i\+\+\)\s*ar\s*=\s*ar\.concat\(__read2\(arguments\[i\]\)\);/g,
        'var ar = []; for (var i = 0; i < arguments.length; i++) { ar = ar.concat(__read2(arguments[i])); }'
      );

      // 3. Fix "_step is not defined" in property copy loops (esbuild)
      // Pass _step into _loop function explicitly
      finalCode = finalCode.replace(
        /var\s+_loop\s*=\s*function\s+_loop\s*\(\)\s*\{\s*var\s+key\s*=\s*_step\.value;/g,
        'var _loop = function _loop(_step) { var key = _step.value;'
      );
      finalCode = finalCode.replace(/_loop\(\);/g, '_loop(_step);');

      // 4. Catch safety
      finalCode = finalCode.replace(/catch\s*\(t\)\s*\{\s*\}/g, 'catch(e){}');

      // 5. Global objects (for reflect-metadata and tsyringe)
      finalCode = "var global = global || this; var globalThis = globalThis || this; var self = self || this;\n" + finalCode;

      fs.writeFileSync(outfile, finalCode)
      console.log(`✅ ${item.entry} -> ${outfile}`)
    } catch (err) {
      console.error(`❌ Failed to build ${item.entry}:`, err.message)
    }
  }
}

async function run() {
  cleanGeneratedOutput()
  await buildOnce()
  if (isWatch) {
    const chokidar = require('chokidar')
    const watcher = chokidar.watch('src/**/*.ts', { ignoreInitial: true })
    watcher.on('all', async () => { await buildOnce() })
    console.log('👀 Watching...')
  }
}

run()
