import * as assert from 'assert';

import { UIManager } from '../../uiManager';
import { ProgressSnapshot, TaskCompletion } from '../../types';

describe('UIManager', () => {
    function createProgressSnapshot(): ProgressSnapshot {
        return {
            total: 3,
            completed: 1,
            pending: 2,
            inProgress: 0,
            blocked: 0,
            phases: [],
            completedPhases: 0,
            totalPhases: 0
        };
    }

    function createHistory(): TaskCompletion[] {
        return [{
            taskDescription: 'Test task',
            completedAt: Date.now(),
            duration: 2500,
            iteration: 1
        }];
    }

    it('forwards status updates to both the panel and sidebar surfaces', () => {
        const statuses: Array<{ target: string; status: string; iteration: number; task: string }> = [];
        const statusBarStub = {
            setStatus: () => undefined,
            setIteration: () => undefined,
            setTaskInfo: () => undefined
        };
        const panelStub = {
            updateStatus: (status: string, iteration: number, task: string) => {
                statuses.push({ target: 'panel', status, iteration, task });
            },
            updateCountdown: () => undefined,
            updateHistory: () => undefined,
            updateSessionTiming: () => undefined,
            updateStats: async () => undefined,
            refresh: async () => undefined,
            addLog: () => undefined,
            showPrdGenerating: () => undefined,
            resetPrdGenerating: () => undefined
        };
        const sidebarStub = {
            ...panelStub,
            updateStatus: (status: string, iteration: number, task: string) => {
                statuses.push({ target: 'sidebar', status, iteration, task });
            }
        };

        const manager = new UIManager(statusBarStub as never);
        manager.setPanel(panelStub);
        manager.setSidebarView(sidebarStub);

        manager.updateStatus('waiting', 4, 'Implement install workflow');

        assert.deepStrictEqual(statuses, [
            { target: 'panel', status: 'waiting', iteration: 4, task: 'Implement install workflow' },
            { target: 'sidebar', status: 'waiting', iteration: 4, task: 'Implement install workflow' }
        ]);
    });

    it('replays timing and history updates to both control surfaces', () => {
        const historyCalls: string[] = [];
        const timingCalls: string[] = [];
        const progress = createProgressSnapshot();
        const history = createHistory();
        const statusBarStub = {
            setStatus: () => undefined,
            setIteration: () => undefined,
            setTaskInfo: () => undefined
        };
        const panelStub = {
            updateStatus: () => undefined,
            updateCountdown: () => undefined,
            updateHistory: (entries: TaskCompletion[]) => {
                historyCalls.push(`panel:${entries.length}`);
            },
            updateSessionTiming: (_startTime: number, _history: TaskCompletion[], snapshot: ProgressSnapshot) => {
                timingCalls.push(`panel:${snapshot.total}/${snapshot.completed}`);
            },
            updateStats: async () => undefined,
            refresh: async () => undefined,
            addLog: () => undefined,
            showPrdGenerating: () => undefined,
            resetPrdGenerating: () => undefined
        };
        const sidebarStub = {
            ...panelStub,
            updateHistory: (entries: TaskCompletion[]) => {
                historyCalls.push(`sidebar:${entries.length}`);
            },
            updateSessionTiming: (_startTime: number, _history: TaskCompletion[], snapshot: ProgressSnapshot) => {
                timingCalls.push(`sidebar:${snapshot.total}/${snapshot.completed}`);
            }
        };

        const manager = new UIManager(statusBarStub as never);
        manager.setPanel(panelStub);
        manager.setSidebarView(sidebarStub);

        manager.updateHistory(history);
        manager.updateSessionTiming(1234, history, progress);

        assert.deepStrictEqual(historyCalls, ['panel:1', 'sidebar:1']);
        assert.deepStrictEqual(timingCalls, ['panel:3/1', 'sidebar:3/1']);
    });
});
