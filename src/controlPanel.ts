import * as vscode from 'vscode';
import { getNextTaskAsync, getProgressSnapshotAsync, readPRDAsync } from './fileUtils';
import { ProgressSnapshot, TaskCompletion, TaskRequirements, RalphSettings, TaskScope, DEFAULT_TASK_SCOPE, IRalphUI } from './types';
import {
    getStyles,
    getClientScripts,
    getHeader,
    getControls,
    getSetupSection,
    getTimelineSection,
    getRequirementsSection,
    getTaskSection,
    getLogSection,
    getFooter,
    getSettingsOverlay
} from './webview';

export type PanelEventType =
    | 'openPanel'
    | 'start'
    | 'stop'
    | 'pause'
    | 'resume'
    | 'next'
    | 'generatePrd'
    | 'requirementsChanged'
    | 'settingsChanged';

export interface PanelEventData {
    taskDescription?: string;
    scope?: TaskScope;
    requirements?: TaskRequirements;
    settings?: RalphSettings;
}

export type PanelEventHandler = (data?: PanelEventData) => void;

interface PanelMessage {
    command: string;
    taskDescription?: string;
    scope?: TaskScope;
    requirements?: TaskRequirements;
    settings?: RalphSettings;
}

interface ProgressMessageState extends ProgressSnapshot {
    progress: number;
    nextTask: string | null;
}

export type RalphWebviewMode = 'panel' | 'sidebar';

export async function generateRalphHtmlAsync(mode: RalphWebviewMode): Promise<string> {
    const stats = await getProgressSnapshotAsync();
    const nextTask = await getNextTaskAsync();
    const prd = await readPRDAsync();
    const hasPrd = !!prd;
    const bodyClass = mode === 'sidebar' ? 'layout-sidebar' : 'layout-panel';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ralph</title>
    <style>${getStyles()}</style>
</head>
<body class="${bodyClass}">
    ${getHeader()}
    ${getControls(hasPrd, { showOpenPanelButton: mode === 'sidebar' })}
    <div class="content">
        ${getSetupSection()}
        ${getTimelineSection()}
        ${hasPrd ? getRequirementsSection() : ''}
        ${getTaskSection(nextTask, stats.total > 0)}
        ${getLogSection()}
        ${mode === 'panel' ? getFooter() : ''}
    </div>
    ${getSettingsOverlay()}
    <script>${getClientScripts()}</script>
</body>
</html>`;
}

abstract class RalphWebviewUIBase implements IRalphUI {
    private lastStatus = 'idle';
    private lastIteration = 0;
    private lastTaskInfo = '';
    private lastCountdown = 0;
    private lastHistory: TaskCompletion[] = [];
    private lastTiming = {
        startTime: 0,
        taskHistory: [] as TaskCompletion[],
        progress: {
            total: 0,
            completed: 0,
            pending: 0,
            inProgress: 0,
            blocked: 0,
            phases: [],
            completedPhases: 0,
            totalPhases: 0
        } as ProgressSnapshot
    };
    private lastStats: ProgressMessageState | null = null;
    private logEntries: Array<{ message: string; highlight: boolean }> = [];
    private isPrdGenerating = false;
    private readonly eventHandlers = new Map<PanelEventType, Set<PanelEventHandler>>();

    public on(event: PanelEventType, handler: PanelEventHandler): vscode.Disposable {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        const handlers = this.eventHandlers.get(event);
        handlers?.add(handler);

        return {
            dispose: () => {
                this.eventHandlers.get(event)?.delete(handler);
            }
        };
    }

    protected emit(event: PanelEventType, data?: PanelEventData): void {
        this.eventHandlers.get(event)?.forEach(handler => handler(data));
    }

    protected handleMessage(message: PanelMessage): void {
        switch (message.command) {
            case 'ready':
                this.restoreState();
                break;
            case 'openPanel':
                this.emit('openPanel');
                break;
            case 'start':
                this.emit('start');
                break;
            case 'stop':
                this.emit('stop');
                break;
            case 'pause':
                this.emit('pause');
                break;
            case 'resume':
                this.emit('resume');
                break;
            case 'next':
                this.emit('next');
                break;
            case 'refresh':
                void this.refresh();
                break;
            case 'generatePrd':
                if (message.taskDescription) {
                    this.emit('generatePrd', {
                        taskDescription: message.taskDescription,
                        scope: message.scope ?? DEFAULT_TASK_SCOPE
                    });
                }
                break;
            case 'requirementsChanged':
                if (message.requirements) {
                    this.emit('requirementsChanged', { requirements: message.requirements });
                }
                break;
            case 'settingsChanged':
                if (message.settings) {
                    this.emit('settingsChanged', { settings: message.settings });
                }
                break;
        }
    }

    public updateStatus(status: string, iteration: number, taskInfo: string, _history: TaskCompletion[]): void {
        this.lastStatus = status;
        this.lastIteration = iteration;
        this.lastTaskInfo = taskInfo;
        this.postMessage({ type: 'update', status, iteration, taskInfo });
    }

    public updateCountdown(seconds: number): void {
        this.lastCountdown = seconds;
        this.postMessage({ type: 'countdown', seconds });
    }

    public updateHistory(history: TaskCompletion[]): void {
        this.lastHistory = [...history];
        this.postMessage({ type: 'history', history });
    }

    public updateSessionTiming(startTime: number, taskHistory: TaskCompletion[], progress: ProgressSnapshot): void {
        this.lastTiming = {
            startTime,
            taskHistory: [...taskHistory],
            progress: { ...progress, phases: [...progress.phases] }
        };
        this.postMessage({ type: 'timing', startTime, taskHistory, progress });
    }

    public async updateStats(): Promise<void> {
        const stats = await getProgressSnapshotAsync();
        const nextTask = await getNextTaskAsync();
        const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        this.lastStats = {
            ...stats,
            completed: stats.completed,
            pending: stats.pending,
            total: stats.total,
            progress,
            nextTask: nextTask?.description || null
        };

        this.postMessage({
            type: 'stats',
            ...stats,
            completed: stats.completed,
            pending: stats.pending,
            total: stats.total,
            progress,
            nextTask: nextTask?.description || null
        });
    }

    public addLog(message: string, highlight = false): void {
        this.logEntries.push({ message, highlight });
        this.postMessage({ type: 'log', message, highlight });
    }

    public showPrdGenerating(): void {
        this.isPrdGenerating = true;
        this.postMessage({ type: 'prdGenerating' });
    }

    public resetPrdGenerating(): void {
        this.isPrdGenerating = false;
        this.postMessage({ type: 'prdGenerateReset' });
    }

    protected clearPrdGeneratingState(): void {
        this.isPrdGenerating = false;
    }

    protected restoreState(): void {
        this.postMessage({
            type: 'update',
            status: this.lastStatus,
            iteration: this.lastIteration,
            taskInfo: this.lastTaskInfo
        });

        if (this.lastCountdown > 0) {
            this.postMessage({ type: 'countdown', seconds: this.lastCountdown });
        }

        this.postMessage({ type: 'history', history: this.lastHistory });
        this.postMessage({
            type: 'timing',
            startTime: this.lastTiming.startTime,
            taskHistory: this.lastTiming.taskHistory,
            progress: this.lastTiming.progress
        });

        if (this.lastStats) {
            this.postMessage({ type: 'stats', ...this.lastStats });
        }

        for (const entry of this.logEntries) {
            this.postMessage({ type: 'log', message: entry.message, highlight: entry.highlight });
        }

        if (this.isPrdGenerating) {
            this.postMessage({ type: 'prdGenerating' });
        }
    }

    protected abstract postMessage(message: unknown): void;

    public abstract refresh(): void | Promise<void>;
}

export class RalphPanel extends RalphWebviewUIBase {
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private isDisposed = false;
    private onDisposeCallback?: () => void;

    constructor(panel: vscode.WebviewPanel) {
        super();
        this.panel = panel;
        void this.initializeHtml();
        this.setupMessageHandler();
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static createPanel(extensionUri: vscode.Uri): vscode.WebviewPanel {
        const column = vscode.ViewColumn.Two;
        const panel = vscode.window.createWebviewPanel(
            'ralphPanel', 'Ralph', column,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        panel.iconPath = vscode.Uri.joinPath(extensionUri, 'icon.png');
        return panel;
    }

    public reveal(): void {
        this.panel.reveal(vscode.ViewColumn.Two);
    }

    public onDispose(callback: () => void): void {
        this.onDisposeCallback = callback;
    }

    public async refresh(): Promise<void> {
        this.clearPrdGeneratingState();
        this.panel.webview.html = await generateRalphHtmlAsync('panel');
    }

    private async initializeHtml(): Promise<void> {
        this.panel.webview.html = await generateRalphHtmlAsync('panel');
    }

    private setupMessageHandler(): void {
        this.panel.webview.onDidReceiveMessage(
            (message: PanelMessage) => this.handleMessage(message),
            null,
            this.disposables
        );
    }

    protected postMessage(message: unknown): void {
        if (this.isDisposed) {
            return;
        }

        void this.panel.webview.postMessage(message);
    }

    private dispose(): void {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;
        this.onDisposeCallback?.();
        this.panel.dispose();
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
}

export class RalphSidebarProvider extends RalphWebviewUIBase implements vscode.WebviewViewProvider {
    private view?: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri
    ) {
        super();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        void this.render();

        webviewView.webview.onDidReceiveMessage((message: PanelMessage) => {
            this.handleMessage(message);
        });
    }

    public async refresh(): Promise<void> {
        this.clearPrdGeneratingState();

        if (!this.isViewAvailable()) {
            return;
        }

        try {
            await this.render();
        } catch {
            // Ignore errors when refreshing webview
        }
    }

    protected postMessage(message: unknown): void {
        if (!this.view) {
            return;
        }

        void this.view.webview.postMessage(message);
    }

    private isViewAvailable(): boolean {
        return !!this.view;
    }

    private async render(): Promise<void> {
        if (!this.view) {
            return;
        }

        this.view.webview.html = await generateRalphHtmlAsync('sidebar');
    }
}
