const { MinecraftTestRunner } = require('./minecraft_testing_framework');

const runner = new MinecraftTestRunner();

// Define Suite 1: Command System Tests
runner.addSuite('Tower Defense Commands Suite', (suite) => {

  suite.test('Verify Game Start (/td_start)', async (t) => {
    const p = t.waitForMessage(/(начался|Игра началась)/i);
    t.chat('/td_start');
    const msg = await p;
    t.assert(msg.length > 0, 'Start confirmation message should not be empty');
  });

  suite.test('Verify Stats Command (/td_info)', async (t) => {
    const p = t.waitForMessage(/=== TD STATUS ===/i);
    t.chat('/td_info');
    const stats = await p;
    t.assert(stats.includes('Wave: 1'), 'Initial wave should be 1');
    t.assert(stats.includes('Kills: 0'), 'Initial kills should be 0');
    t.assert(stats.includes('Started: YES'), 'Game should be in started state');
  });

  suite.test('Verify Kill Increment (/td_addkill)', async (t) => {
    const p1 = t.waitForMessage(/(убит|убийство)/i);
    t.chat('/td_addkill');
    const msg = await p1;
    t.assert(msg.includes('+1'), 'Kill feedback should mention +1');

    // Double check state
    const p2 = t.waitForMessage(/=== TD STATUS ===/i);
    t.chat('/td_info');
    const updatedStats = await p2;
    t.assert(updatedStats.includes('Kills: 1'), 'Kill count should be updated to 1');
  });

  suite.test('Verify Game Stop (/td_stop)', async (t) => {
    const p = t.waitForMessage(/(остановлен|Игра остановлена)/i);
    t.chat('/td_stop');
    const msg = await p;
    t.assert(msg.length > 0, 'Stop confirmation message should not be empty');
  });
});

// Define Suite 2: Physical Block Interaction Tests
runner.addSuite('Block Interactions Suite', (suite) => {
  const barrelOffset = { x: 0, y: 0, z: 2 };
  const grindstoneOffset = { x: 0, y: 0, z: -2 };

  suite.test('Farming via Barrel Block', async (t) => {
    // 1. Setup
    await t.placeBlock('minecraft:barrel', barrelOffset);

    // 2. Test click (listening first to avoid race condition)
    const p = t.waitForMessage(/(Balance:|🪙)/i);
    await t.clickBlock('minecraft:barrel');
    const response = await p;
    t.assert(response.includes('+'), 'Farming output should display balance gain');

    // 3. Cleanup
    await t.removeBlock(barrelOffset);
  });

  suite.test('Upgrades via Grindstone Block', async (t) => {
    // 1. Setup
    await t.placeBlock('minecraft:grindstone', grindstoneOffset);

    // 2. Test click (listening first to avoid race condition)
    const p = t.waitForMessage(/(purchased|Not enough funds)/i);
    await t.clickBlock('minecraft:grindstone');
    const response = await p;
    t.assert(response.includes('funds') || response.includes('purchased'), 'Should reply about upgrade transaction');

    // 3. Cleanup
    await t.removeBlock(grindstoneOffset);
  });
});

// Define Suite 3: Custom Entity Spawning & Interactions
runner.addSuite('Custom Entity (Fedia Skeleton) Suite', (suite) => {
  
  suite.test('Summon, hit and kill Fedia Skeleton', async (t) => {
    // 1. Summon the skeleton
    t.chat('/summon minecraft_td:fedia_skeleton ~ ~ ~2');
    await t.sleep(2000); // Wait for spawn

    // 2. Find entity
    const fedia = t.bot.nearestEntity(e => 
      e.name === 'fedia_skeleton' || 
      e.displayName?.includes('Федя') || 
      (e.name?.includes('skeleton') && e.position.distanceTo(t.bot.entity.position) < 5) ||
      (e.name === 'unknown' && e.position.distanceTo(t.bot.entity.position) < 5)
    );
    if (!fedia) {
      console.log('\n[DEBUG] Nearby entities:');
      Object.keys(t.bot.entities).forEach(id => {
        const ent = t.bot.entities[id];
        console.log(`  - Name: "${ent.name}", Type: "${ent.type}", DisplayName: "${ent.displayName}", Position: ${ent.position}`);
      });
    }
    t.assert(fedia !== null, 'Fedia skeleton entity should be spawned and found near the bot');

    // 3. Attack Fedia and verify hurt message is printed in chat
    const hurtPromise = t.waitForMessage(/(Федя:|Ай|За что|Осторожнее)/i);
    await t.bot.lookAt(fedia.position.offset(0, 1.6, 0));
    t.bot.attack(fedia);
    const hurtMsg = await hurtPromise;
    t.assert(hurtMsg.includes('Федя') || hurtMsg.includes('Ай') || hurtMsg.includes('За что'), 'Fedia should say a hurt line in chat');

    // 4. Kill Fedia and verify death announcement
    const deathPromise = t.waitForMessage(/(пал в бою|вернётся)/i);
    t.chat('/kill @e[type=minecraft_td:fedia_skeleton,limit=1]');
    const deathMsg = await deathPromise;
    t.assert(deathMsg.includes('Федя пал в бою') || deathMsg.includes('пал в бою'), 'Death announcement should be sent in chat');
  });
});

// Define Suite 4: Blaze Tower Construction and Behavior
runner.addSuite('Blaze Tower Construction Suite', (suite) => {
  const placeOffset = { x: 0, y: 0, z: 3 };

  suite.test('Build and verify Blaze Tower', async (t) => {
    // 1. Give gold to bot/player using the new command
    t.chat('/td_addgold');
    await t.sleep(500);

    // Give construction item to bot
    t.chat('/give TestRunner kubejs:td_blaze_tower_item 1');
    await t.sleep(500);

    // Set supporting block
    await t.placeBlock('minecraft:stone', placeOffset);

    // 2. Select slot with item
    t.bot.setQuickBarSlot(0); // Select slot 0
    
    // Look at and right click the stone block while holding the tower item
    const buildPromise = t.waitForMessage(/(построена|золота)/i);
    await t.clickBlock('minecraft:stone');
    const msg = await buildPromise;
    t.assert(msg.includes('построена') || msg.includes('золота'), 'Should successfully build the tower');

    // 3. Verify that the blaze tower entity is spawned nearby
    const tower = t.bot.nearestEntity(e => 
      e.name === 'blaze_tower' || 
      e.displayName?.includes('Огненная') ||
      (e.name?.includes('blaze') && e.position.distanceTo(t.bot.entity.position) < 8) ||
      (e.name === 'unknown' && e.position.distanceTo(t.bot.entity.position) < 8)
    );
    t.assert(tower !== null, 'Blaze Tower entity should be spawned near the bot');

    // 4. Cleanup: kill the spawned tower and remove the block
    t.chat('/kill @e[type=minecraft_td:blaze_tower,limit=1]');
    await t.removeBlock(placeOffset);
  });
});

// Execute the tests
const host = process.env.DEV_BOT_HOST || 'localhost';
const port = Number(process.env.DEV_BOT_PORT || 25565);

runner.run({
  host,
  port,
  username: 'TestRunner'
});
