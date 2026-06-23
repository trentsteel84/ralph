import * as assert from 'assert';
import * as sinon from 'sinon';

import * as fileUtils from '../../fileUtils';
import { LoopOrchestrator } from '../../orchestrator';
import { LoopExecutionState, TaskCompletion, TaskScope, TaskStatus } from '../../types';

suite('LoopOrchestrator reset behavior', () => {
    teardown(() => {
        sinon.restore();
    });

    test('resets to idle instead of waiting when Copilot does not start', async () => {
        sinon.stub(fileUtils, 'getTaskStatsAsync').resolves({ completed: 0, pending: 1, total: 1 });
        sinon.stub(fileUtils, 'getNextTaskAsync').resolves({
            id: 'task-1',
            description: 'Implement reset logic',
            status: TaskStatus.PENDING,
            lineNumber: 1,
            rawLine: '- [ ] Implement reset logic'
        });

        const statusUpdates: Array<{ status: string; iteration: number; task: string }> = [];
        const logMessages: string[] = [];
        let watcherEnabled = false;

        const orchestrator = new LoopOrchestrator({
            setStatus: () => undefined,
            setIteration: () => undefined,
            setTaskInfo: () => undefined
        } as never);

        const uiStub = {
            addLog: (message: string) => {
                logMessages.push(message);
            },
            setIteration: () => undefined,
            setTaskInfo: () => undefined,
            updateStatus: (status: string, iteration: number, task: string) => {
                statusUpdates.push({ status, iteration, task });
            },
            updateCountdown: () => undefined,
            updateSessionTiming: () => undefined,
            updateStats: async () => undefined,
            updateHistory: (_history: TaskCompletion[]) => undefined,
            clearLogs: () => undefined,
            refresh: async () => undefined,
            showPrdGenerating: () => undefined,
            resetPrdGenerating: () => undefined
        };

        const taskRunnerStub = {
            checkIterationLimit: () => false,
            incrementIteration: () => 1,
            setCurrentTask: () => undefined,
            triggerCopilotAgent: async () => null,
            getTaskHistory: () => [],
            resetIterations: () => undefined
        };

        (orchestrator as unknown as { ui: typeof uiStub }).ui = uiStub;
        (orchestrator as unknown as { taskRunner: typeof taskRunnerStub }).taskRunner = taskRunnerStub;
        (orchestrator as unknown as { fileWatchers: { dispose: () => void; prdWatcher: { enable: () => void } } }).fileWatchers = {
            dispose: () => undefined,
            prdWatcher: {
                enable: () => {
                    watcherEnabled = true;
                }
            }
        } as never;
        (orchestrator as unknown as { countdownTimer: { stop: () => void } }).countdownTimer = { stop: () => undefined };
        (orchestrator as unknown as { inactivityMonitor: { stop: () => void; setWaiting: (_waiting: boolean) => void } }).inactivityMonitor = {
            stop: () => undefined,
            setWaiting: () => undefined
        };
        (orchestrator as unknown as { state: LoopExecutionState }).state = LoopExecutionState.RUNNING;
        (orchestrator as unknown as { isPaused: boolean }).isPaused = false;

        await (orchestrator as unknown as { runNextTask: () => Promise<void> }).runNextTask();

        assert.strictEqual(watcherEnabled, false);
        assert.ok(logMessages.includes('Copilot did not start. Ralph reset to idle so you can retry.'));
        assert.deepStrictEqual(statusUpdates[statusUpdates.length - 1], { status: 'idle', iteration: 0, task: '' });
        assert.strictEqual((orchestrator as unknown as { state: LoopExecutionState }).state, LoopExecutionState.IDLE);
    });

    test('resets PRD generating controls when fresh chat startup does not launch PRD generation', async () => {
        sinon.stub(fileUtils, 'getWorkspaceRoot').returns('c:/Repos/ralph');

        const logMessages: string[] = [];
        let showPrdGeneratingCalls = 0;
        let resetPrdGeneratingCalls = 0;
        let refreshCalls = 0;
        let watcherDisposed = false;

        const orchestrator = new LoopOrchestrator({
            setStatus: () => undefined,
            setIteration: () => undefined,
            setTaskInfo: () => undefined
        } as never);

        const uiStub = {
            addLog: (message: string) => {
                logMessages.push(message);
            },
            setIteration: () => undefined,
            setTaskInfo: () => undefined,
            updateStatus: () => undefined,
            updateCountdown: () => undefined,
            updateSessionTiming: () => undefined,
            updateStats: async () => undefined,
            updateHistory: (_history: TaskCompletion[]) => undefined,
            clearLogs: () => undefined,
            refresh: async () => {
                refreshCalls += 1;
            },
            showPrdGenerating: () => {
                showPrdGeneratingCalls += 1;
            },
            resetPrdGenerating: () => {
                resetPrdGeneratingCalls += 1;
            }
        };

        const taskRunnerStub = {
            triggerPrdGeneration: async () => null
        };

        (orchestrator as unknown as { ui: typeof uiStub }).ui = uiStub;
        (orchestrator as unknown as { taskRunner: typeof taskRunnerStub }).taskRunner = taskRunnerStub;
        (orchestrator as unknown as { fileWatchers: { prdCreationWatcher: { dispose: () => void; start: () => void } } }).fileWatchers = {
            prdCreationWatcher: {
                dispose: () => {
                    watcherDisposed = true;
                },
                start: () => undefined
            }
        } as never;

        await orchestrator.generatePrdFromDescription('Build a scheduler', TaskScope.MEDIUM);

        assert.strictEqual(showPrdGeneratingCalls, 1);
        assert.strictEqual(resetPrdGeneratingCalls, 1);
        assert.strictEqual(refreshCalls, 1);
        assert.strictEqual(watcherDisposed, true);
        assert.ok(logMessages.includes('PRD generation did not start. Ready to retry.'));
    });

    test('clears progress timing snapshot when stopping the loop', async () => {
        const timingUpdates: Array<{ startTime: number; progress: unknown }> = [];

        const orchestrator = new LoopOrchestrator({
            setStatus: () => undefined,
            setIteration: () => undefined,
            setTaskInfo: () => undefined
        } as never);

        const uiStub = {
            addLog: () => undefined,
            setIteration: () => undefined,
            setTaskInfo: () => undefined,
            updateStatus: () => undefined,
            updateCountdown: () => undefined,
            updateSessionTiming: (startTime: number, _history: TaskCompletion[], progress: unknown) => {
                timingUpdates.push({ startTime, progress });
            },
            updateStats: async () => undefined,
            updateHistory: (_history: TaskCompletion[]) => undefined,
            clearLogs: () => undefined,
            refresh: async () => undefined,
            showPrdGenerating: () => undefined,
            resetPrdGenerating: () => undefined
        };

        const taskRunnerStub = {
            getTaskHistory: () => [{
                taskDescription: 'Existing task',
                completedAt: Date.now(),
                duration: 1000,
                iteration: 1
            }],
            resetIterations: () => undefined,
            setCurrentTask: () => undefined
        };

        (orchestrator as unknown as { ui: typeof uiStub }).ui = uiStub;
        (orchestrator as unknown as { taskRunner: typeof taskRunnerStub }).taskRunner = taskRunnerStub;
        (orchestrator as unknown as { fileWatchers: { dispose: () => void } }).fileWatchers = {
            dispose: () => undefined
        } as never;
        (orchestrator as unknown as { countdownTimer: { stop: () => void } }).countdownTimer = { stop: () => undefined };
        (orchestrator as unknown as { inactivityMonitor: { stop: () => void } }).inactivityMonitor = { stop: () => undefined };
        (orchestrator as unknown as { sessionStartTime: number }).sessionStartTime = Date.now();

        await orchestrator.stopLoop();

        assert.strictEqual(timingUpdates.length > 0, true);
        assert.deepStrictEqual(timingUpdates[timingUpdates.length - 1], {
            startTime: 0,
            progress: {
                total: 0,
                completed: 0,
                pending: 0,
                inProgress: 0,
                blocked: 0,
                phases: [],
                completedPhases: 0,
                totalPhases: 0
            }
        });
    });
});
