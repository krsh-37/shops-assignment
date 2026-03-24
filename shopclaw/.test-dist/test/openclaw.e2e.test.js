import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaunchRun, runLaunch, startLaunch } from '../src/mastra/openclaw/service.js';
const sampleIdea = 'I want to sell custom socks delivered in 10 minutes like Zepto but for socks.';
test('runLaunch completes the OpenClaw workflow end to end', async () => {
    const run = await runLaunch(sampleIdea);
    assert.equal(run.status, 'completed');
    assert.ok(run.memory.idea);
    assert.ok(run.memory.research);
    assert.ok(run.memory.visual);
    assert.ok(run.memory.domains);
    assert.ok(run.memory.gtm);
    assert.ok(run.memory.shopify);
    assert.ok(run.memory.ads);
    assert.ok(run.memory.seo);
    assert.ok(run.report);
    assert.ok(run.completedAgents.includes('research-agent'));
    assert.ok(run.completedAgents.includes('launch-report-agent'));
});
test('Shopify output compounds visual palette and research keywords', async () => {
    const run = await runLaunch(sampleIdea);
    const palette = run.memory.visual?.palette ?? [];
    const products = run.memory.shopify?.products ?? [];
    const keywords = run.memory.research?.keywords.primary ?? [];
    assert.deepEqual(run.memory.shopify?.theme_settings.palette, palette);
    assert.ok(products.some(product => keywords.some(keyword => product.description.includes(keyword))));
});
test('startLaunch exposes async status that can be polled', async () => {
    const queued = startLaunch(sampleIdea);
    assert.equal(queued.status, 'queued');
    let resolved = getLaunchRun(queued.id);
    for (let attempt = 0; attempt < 20; attempt += 1) {
        if (resolved?.status === 'completed') {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
        resolved = getLaunchRun(queued.id);
    }
    assert.ok(resolved);
    assert.equal(resolved?.status, 'completed');
    assert.ok(resolved?.report?.markdown.includes('OpenClaw Launch Bible'));
});
