import * as vscode from 'vscode';
import { RalphStatusBar } from './statusBar';
import { RalphPanel, RalphSidebarProvider, PanelEventHandler, PanelEventType } from './controlPanel';
import { LoopOrchestrator } from './orchestrator';
import { DEFAULT_TASK_SCOPE } from './types';
import { log, disposeLogger, showLogs } from './logger';

class RalphExtension {
    private statusBar: RalphStatusBar;
    private orchestrator: LoopOrchestrator;
    private readonly sidebarProvider: RalphSidebarProvider;
    private currentPanel: RalphPanel | null = null;
    private panelEventHandlers: vscode.Disposable[] = [];
    private sidebarEventHandlers: vscode.Disposable[] = [];

    constructor(private readonly context: vscode.ExtensionContext) {
        log('Ralph extension activating...');

        this.statusBar = new RalphStatusBar();
        context.subscriptions.push(this.statusBar);

        this.orchestrator = new LoopOrchestrator(this.statusBar);

        this.sidebarProvider = new RalphSidebarProvider(context.extensionUri);
        this.orchestrator.setSidebarView(this.sidebarProvider);
        this.sidebarEventHandlers = this.registerControlSurfaceHandlers(this.sidebarProvider);

        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('ralph.sidebarView', this.sidebarProvider)
        );

        this.registerCommands();

        context.subscriptions.push({
            dispose: () => this.dispose()
        });

        log('Ralph extension activated');
    }

    private registerCommands(): void {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('ralph.showPanel', () => {
                this.showPanel();
            }),

            vscode.commands.registerCommand('ralph.viewLogs', () => {
                showLogs();
            })
        );
    }

    private showPanel(): void {
        if (this.currentPanel) {
            this.currentPanel.reveal();
            this.currentPanel.refresh();
            return;
        }

        const webviewPanel = RalphPanel.createPanel(this.context.extensionUri);
        this.currentPanel = new RalphPanel(webviewPanel);
        this.orchestrator.setPanel(this.currentPanel);

        this.currentPanel.onDispose(() => {
            this.cleanupPanel();
        });

        this.panelEventHandlers = this.registerControlSurfaceHandlers(this.currentPanel);
    }

    private registerControlSurfaceHandlers(surface: {
        on(event: PanelEventType, handler: PanelEventHandler): vscode.Disposable;
    }): vscode.Disposable[] {
        return [
            surface.on('openPanel', () => this.showPanel()),
            surface.on('start', () => this.orchestrator.startLoop()),
            surface.on('stop', () => this.orchestrator.stopLoop()),
            surface.on('pause', () => this.orchestrator.pauseLoop()),
            surface.on('resume', () => this.orchestrator.resumeLoop()),
            surface.on('next', () => this.orchestrator.runSingleStep()),
            surface.on('generatePrd', (data) => {
                if (data?.taskDescription) {
                    this.orchestrator.generatePrdFromDescription(
                        data.taskDescription,
                        data.scope ?? DEFAULT_TASK_SCOPE
                    );
                }
            }),
            surface.on('requirementsChanged', (data) => {
                if (data?.requirements) {
                    this.orchestrator.setRequirements(data.requirements);
                }
            }),
            surface.on('settingsChanged', (data) => {
                if (data?.settings) {
                    this.orchestrator.setSettings(data.settings);
                }
            })
        ];
    }

    private cleanupPanel(): void {
        this.panelEventHandlers.forEach(d => d.dispose());
        this.panelEventHandlers = [];
        this.currentPanel = null;
        this.orchestrator.setPanel(null);
    }

    dispose(): void {
        this.cleanupPanel();
        this.sidebarEventHandlers.forEach(d => d.dispose());
        this.sidebarEventHandlers = [];
        this.orchestrator.dispose();
        disposeLogger();
    }
}

let extensionInstance: RalphExtension | null = null;

export function activate(context: vscode.ExtensionContext): void {
    extensionInstance = new RalphExtension(context);
}

export function deactivate(): void {
    log('Ralph extension deactivating...');
    extensionInstance?.dispose();
    extensionInstance = null;
}
