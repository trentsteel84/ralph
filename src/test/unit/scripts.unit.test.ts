import * as assert from 'assert';
import { getClientScripts } from '../../webview/scripts';

describe('Webview Scripts', () => {
    describe('getClientScripts', () => {
        it('should return a string', () => {
            const scripts = getClientScripts();
            assert.strictEqual(typeof scripts, 'string');
        });

        it('should include vscode API acquisition', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('acquireVsCodeApi'));
        });

        it('should include send function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function send(command)'));
        });

        it('should include toggleRequirements function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function toggleRequirements()'));
        });

        it('should include updateRequirements function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateRequirements()'));
        });

        it('should include openSettings function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function openSettings()'));
        });

        it('should include closeSettings function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function closeSettings()'));
        });

        it('should include updateSettings function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateSettings()'));
        });

        it('should include updateUI function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateUI(status, iteration, taskInfo)'));
        });

        it('should hide the setup section whenever Ralph is not idle', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("const setupSection = document.getElementById('setupSection')"));
            assert.ok(scripts.includes("setupSection.style.display = status === 'idle' ? 'block' : 'none'"));
        });

        it('should include showCountdown function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function showCountdown(seconds)'));
        });

        it('should include addLog function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function addLog(message'));
        });

        it('should include generatePrd function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function generatePrd()'));
        });

        it('should read and post the selected task scope during PRD generation', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('input[name="taskScope"]:checked'));
            assert.ok(scripts.includes('scope: scope'));
        });

        it('should include resetGeneratePrdButton function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function resetGeneratePrdButton()'));
        });

        it('should include message event listener', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("window.addEventListener('message'"));
        });

        it('should handle update message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'update'"));
        });

        it('should handle countdown message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'countdown'"));
        });

        it('should handle log message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'log'"));
        });

        it('should handle prdGenerating message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'prdGenerating'"));
        });

        it('should handle PRD reset message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'prdGenerateReset'"));
        });

        it('should handle history message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'history'"));
        });

        it('should handle timing message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'timing'"));
        });

        it('should handle stats message type', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("msg.type === 'stats'"));
        });

        it('should include updateStatsDisplay function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateStatsDisplay(stats)'));
        });

        it('should include updatePipeline function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updatePipeline(completed, pending, blocked)'));
        });

        it('should include updateTiming function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateTiming(startTime, taskHistory, progress)'));
        });

        it('should include updateElapsedAndEta function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateElapsedAndEta()'));
        });

        it('should include formatTime function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function formatTime(ms)'));
        });

        it('should include updateTimeline function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateTimeline(history)'));
        });

        it('should include addPendingBars function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function addPendingBars(bars, labels, startNum, count, avgDuration, maxDuration)'));
        });

        it('should include addCurrentTaskBar function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function addCurrentTaskBar(bars, labels, taskNum, maxDuration)'));
        });

        it('should include updateCurrentTaskBar function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function updateCurrentTaskBar()'));
        });

        it('should include formatDuration function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function formatDuration(ms)'));
        });

        it('should include getTaskStats function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function getTaskStats()'));
        });

        it('should include phase-aware timeline summary helpers', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('function normalizeProgress(progress)'));
            assert.ok(scripts.includes('function updateTimelineSummary(stats)'));
            assert.ok(scripts.includes('timelinePhaseSummary'));
        });

        it('should include TOTAL_COUNTDOWN constant', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('TOTAL_COUNTDOWN'));
        });

        it('should include sessionStartTime variable', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('sessionStartTime'));
        });

        it('should include currentTaskHistory variable', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('currentTaskHistory'));
        });

        it('should include status labels for idle, running, waiting, paused', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("'idle'"));
            assert.ok(scripts.includes("'running'"));
            assert.ok(scripts.includes("'waiting'"));
            assert.ok(scripts.includes("'paused'"));
        });

        it('should post messages to vscode', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes('vscode.postMessage'));
        });

        it('should notify the extension when the webview is ready', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("vscode.postMessage({ command: 'ready' })"));
        });

        it('should include optimistic UI updates in send function', () => {
            const scripts = getClientScripts();
            assert.ok(scripts.includes("command === 'start'"));
            assert.ok(scripts.includes("command === 'pause'"));
            assert.ok(scripts.includes("command === 'stop'"));
        });

        it('should handle requirements checkbox values', () => {
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
