const mineflayer = require('mineflayer');

class TestContext {
  constructor(bot, suiteName) {
    this.bot = bot;
    this.suiteName = suiteName;
    this.currentTestName = '';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  chat(message) {
    this.bot.chat(message);
  }

  /**
   * Waits for a chat message that matches the given regex pattern
   */
  waitForMessage(pattern, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.bot.off('message', handler);
        reject(new Error(`Timeout waiting for message matching: ${pattern}`));
      }, timeoutMs);

      const handler = (jsonMsg) => {
        const text = jsonMsg.toString();
        if (pattern.test(text)) {
          clearTimeout(timer);
          this.bot.off('message', handler);
          resolve(text);
        }
      };

      this.bot.on('message', handler);
    });
  }

  /**
   * Places a block relative to the bot's position using /setblock
   */
  async placeBlock(blockName, offset = { x: 0, y: 0, z: 2 }) {
    const pos = this.bot.entity.position.floored();
    const targetX = pos.x + offset.x;
    const targetY = pos.y + offset.y;
    const targetZ = pos.z + offset.z;
    this.chat(`/setblock ${targetX} ${targetY} ${targetZ} ${blockName}`);
    await this.sleep(1000); // Wait for block update
    return { x: targetX, y: targetY, z: targetZ };
  }

  /**
   * Replaces a block relative to the bot's position with air
   */
  async removeBlock(offset = { x: 0, y: 0, z: 2 }) {
    await this.placeBlock('minecraft:air', offset);
  }

  /**
   * Finds, looks at, and right-clicks a block
   */
  async clickBlock(blockName, maxDistance = 32) {
    const mcData = this.bot.registry;
    const blockId = mcData.blocksByName[blockName.replace('minecraft:', '')]?.id;
    if (!blockId) {
      throw new Error(`Block type "${blockName}" not found in registries`);
    }

    const block = this.bot.findBlock({
      matching: blockId,
      maxDistance: maxDistance
    });

    if (!block) {
      throw new Error(`Block "${blockName}" not found within ${maxDistance} blocks`);
    }

    await this.bot.lookAt(block.position.offset(0.5, 0.5, 0.5));
    await this.bot.activateBlock(block);
    await this.sleep(500);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message} (Expected: ${expected}, Got: ${actual})`);
    }
  }
}

class MinecraftTestRunner {
  constructor() {
    this.suites = [];
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  /**
   * Register a new test suite
   */
  addSuite(name, setupFn) {
    const tests = [];
    const suite = {
      name,
      test: (testName, testFn) => {
        tests.push({ name: testName, fn: testFn });
      }
    };
    setupFn(suite);
    this.suites.push({ name, tests });
  }

  /**
   * Run all registered suites using a temporary Mineflayer bot connection
   */
  run(options = {}) {
    const host = options.host || 'localhost';
    const port = options.port || 25565;
    const username = options.username || 'TestRunner';

    console.log(`\n\x1b[35m==================================================\x1b[0m`);
    console.log(`🚀 \x1b[1mMINECRAFT E2E TEST RUNNER STARTING\x1b[0m`);
    console.log(`📡 Connecting to ${host}:${port} as "${username}"...`);
    console.log(`\x1b[35m==================================================\x1b[0m\n`);

    const bot = mineflayer.createBot({ host, port, username });

    bot.once('spawn', async () => {
      console.log(`\x1b[32m✅ Bot connected and spawned!\x1b[0m Starting execution of ${this.suites.length} suites...\n`);
      bot.chat('/kubejs reload server_scripts');
      await new Promise(resolve => setTimeout(resolve, 3000)); // wait for chunks and reload to complete

      for (const suite of this.suites) {
        console.log(`\x1b[34m\x1b[1mSuite: ${suite.name}\x1b[0m`);
        
        for (const test of suite.tests) {
          const context = new TestContext(bot, suite.name);
          context.currentTestName = test.name;

          process.stdout.write(`  🏃 Running "${test.name}"... `);

          try {
            const start = Date.now();
            await test.fn(context);
            const duration = Date.now() - start;

            console.log(`\x1b[32mPASSED\x1b[0m (${duration}ms)`);
            this.results.passed++;
            this.results.details.push({ suite: suite.name, test: test.name, status: 'PASSED', duration });
          } catch (err) {
            console.log(`\x1b[31mFAILED\x1b[0m`);
            console.log(`    \x1b[31mError: ${err.message}\x1b[0m`);
            this.results.failed++;
            this.results.details.push({ suite: suite.name, test: test.name, status: 'FAILED', error: err.message });
          }
        }
        console.log(''); // spacer
      }

      this.printSummary();
      bot.quit();
      process.exit(this.results.failed > 0 ? 1 : 0);
    });

    bot.on('error', err => {
      console.error(`\n\x1b[31m❌ Connection Error: ${err.message}\x1b[0m`);
      process.exit(1);
    });
  }

  printSummary() {
    console.log(`\x1b[35m==================== SUMMARY ====================\x1b[0m`);
    console.log(`✅ Passed: \x1b[32m${this.results.passed}\x1b[0m`);
    console.log(`❌ Failed: \x1b[31m${this.results.failed}\x1b[0m`);
    console.log(`📊 Total:  ${this.results.passed + this.results.failed}`);
    console.log(`\x1b[35m=================================================\x1b[0m`);
    
    if (this.results.failed > 0) {
      console.log(`\n\x1b[31m❌ Some tests failed. Check the logs above.\x1b[0m`);
    } else {
      console.log(`\n\x1b[32m🎉 All test suites passed successfully!\x1b[0m`);
    }
  }
}

module.exports = {
  MinecraftTestRunner
};
