export enum LoopExecutionState {
    IDLE = 'IDLE',
    RUNNING = 'RUNNING'
}

export interface Task {
    id: string;
    description: string;
    status: TaskStatus;
    lineNumber: number;
    rawLine: string;
    phaseTitle?: string;
}

export enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETE = 'COMPLETE',
    BLOCKED = 'BLOCKED'
}

export interface RalphConfig {
    files: {
        prdPath: string;
        progressPath: string;
    };
    prompt: {
        customTemplate: string;
        customPrdGenerationTemplate: string;
    };
}

export const DEFAULT_CONFIG: RalphConfig = {
    files: {
        prdPath: 'PRD.md',
        progressPath: 'progress.txt'
    },
    prompt: {
        customTemplate: '',
        customPrdGenerationTemplate: ''
    }
};

export interface TaskCompletion {
    taskDescription: string;
    completedAt: number;
    duration: number;
    iteration: number;
}

export interface PhaseProgress {
    title: string;
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    blocked: number;
}

export interface ProgressSnapshot {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    blocked: number;
    phases: PhaseProgress[];
    completedPhases: number;
    totalPhases: number;
}

export interface TaskRequirements {
    runTests: boolean;
    runLinting: boolean;
    runTypeCheck: boolean;
    writeTests: boolean;
    updateDocs: boolean;
    commitChanges: boolean;
}

export const DEFAULT_REQUIREMENTS: TaskRequirements = {
    runTests: false,
    runLinting: false,
    runTypeCheck: false,
    writeTests: false,
    updateDocs: false,
    commitChanges: false
};

export interface RalphSettings {
    maxIterations: number;
}

export const DEFAULT_SETTINGS: RalphSettings = {
    maxIterations: 50
};

export enum TaskScope {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large'
}

export const DEFAULT_TASK_SCOPE = TaskScope.MEDIUM;

export const REVIEW_COUNTDOWN_SECONDS = 12;

export const INACTIVITY_TIMEOUT_MS = 60_000;

export const INACTIVITY_CHECK_INTERVAL_MS = 10_000;

export interface IRalphUI {
    updateStatus(status: string, iteration: number, currentTask: string, history: TaskCompletion[]): void;
    updateCountdown(seconds: number): void;
    updateHistory(history: TaskCompletion[]): void;
    updateSessionTiming(startTime: number, taskHistory: TaskCompletion[], progress: ProgressSnapshot): void;
    updateStats(): void | Promise<void>;
    refresh(): void | Promise<void>;
    addLog(message: string, highlight?: boolean): void;
    showPrdGenerating(): void;
    resetPrdGenerating(): void;
}
