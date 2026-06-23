import * as assert from 'assert';
import { getClientScripts } from '../../webview/scripts';

suite('Webview Scripts Test Suite', () => {
    suite('getClientScripts', () => {
        test('should return a string', () => {
            const scripts = getClientScripts();
            assert.strictEqual(typeof scripts, 'string');
        });

        test('should include vscode API acquisition', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('acquireVsCodeApi'));
        });

        test('should include send function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function send(command)'));
        });

        test('should include toggleRequirements function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function toggleRequirements()'));
        });

        test('should include updateRequirements function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateRequirements()'));
        });

        test('should include openSettings function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function openSettings()'));
        });

        test('should include closeSettings function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function closeSettings()'));
        });

        test('should include updateSettings function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateSettings()'));
        });

        test('should include updateUI function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateUI(status, iteration, taskInfo)'));
        });

        test('should include showCountdown function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function showCountdown(seconds)'));
        });

        test('should include addLog function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function addLog(message'));
        });

        test('should include generatePrd function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function generatePrd()'));
        });

        test('should read and post the selected task scope during PRD generation', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('input[name="taskScope"]:checked'));
            assert.ok(scripts.includes('scope: scope'));
        });

        test('should include resetGeneratePrdButton function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function resetGeneratePrdButton()'));
        });

        test('should include message event listener', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("window.addEventListener('message'"));
        });

        test('should handle update message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'update'"));
        });

        test('should handle countdown message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'countdown'"));
        });

        test('should handle log message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'log'"));
        });

        test('should handle prdGenerating message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'prdGenerating'"));
        });

        test('should handle PRD reset message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'prdGenerateReset'"));
        });

        test('should handle history message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'history'"));
        });

        test('should handle timing message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'timing'"));
        });

        test('should handle stats message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'stats'"));
        });

        test('should include updateStatsDisplay function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateStatsDisplay(stats)'));
        });

        test('should include updatePipeline function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updatePipeline(completed, pending, blocked)'));
        });

        test('should include updateTiming function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateTiming(startTime, taskHistory, progress)'));
        });

        test('should include updateElapsedAndEta function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateElapsedAndEta()'));
        });

        test('should include formatTime function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function formatTime(ms)'));
        });

        test('should include updateTimeline function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateTimeline(history)'));
        });

        test('should include addPendingBars function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function addPendingBars(bars, labels, startNum, count, avgDuration, maxDuration)'));
        });

        test('should include addCurrentTaskBar function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function addCurrentTaskBar(bars, labels, taskNum, maxDuration)'));
        });

        test('should include updateCurrentTaskBar function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateCurrentTaskBar()'));
        });

        test('should include formatDuration function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function formatDuration(ms)'));
        });

        test('should include getTaskStats function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function getTaskStats()'));
        });

        test('should include phase-aware timeline summary helpers', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function normalizeProgress(progress)'));
            assert.ok(scripts.includes('function updateTimelineSummary(stats)'));
            assert.ok(scripts.includes('timelinePhaseSummary'));
        });

        test('should include TOTAL_COUNTDOWN constant', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('TOTAL_COUNTDOWN'));
        });

        test('should include sessionStartTime variable', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('sessionStartTime'));
        });

        test('should include currentTaskHistory variable', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('currentTaskHistory'));
        });

        test('should include status labels for idle, running, waiting, paused', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("'idle'"));
            assert.ok(scripts.includes("'running'"));
            assert.ok(scripts.includes("'waiting'"));
            assert.ok(scripts.includes("'paused'"));
        });

        test('should post messages to vscode', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('vscode.postMessage'));
        });

        test('should notify the extension when the webview is ready', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("vscode.postMessage({ command: 'ready' })"));
        });

        test('should include optimistic UI updates in send function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("command === 'start'"));
            assert.ok(scripts.includes("command === 'pause'"));
            assert.ok(scripts.includes("command === 'stop'"));
        });

        test('should handle requirements checkbox values', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('reqWriteTests'));
            assert.ok(scripts.includes('reqRunTests'));
            assert.ok(scripts.includes('reqTypeCheck'));
            assert.ok(scripts.includes('reqLinting'));
            assert.ok(scripts.includes('reqDocs'));
            assert.ok(scripts.includes('reqCommit'));
        });
    });
});
