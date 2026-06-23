import * as vscode from 'vscode';
import * as path from 'path';
import * as fsPromises from 'fs/promises';

import { PhaseProgress, ProgressSnapshot, Task, TaskStatus } from './types';
import { getConfig } from './config';
import { logError } from './logger';

export function getWorkspaceRoot(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        return workspaceFolders[0].uri.fsPath;
    }
    return null;
}

export async function readPRDAsync(): Promise<string | null> {
    const config = getConfig();
    const root = getWorkspaceRoot();
    if (!root) { return null; }

    const prdPath = path.join(root, config.files.prdPath);
    try {
        await fsPromises.access(prdPath);
        return await fsPromises.readFile(prdPath, 'utf-8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logError('Failed to read PRD.md', error);
        }
        return null;
    }
}

export async function readProgressAsync(): Promise<string> {
    const config = getConfig();
    const root = getWorkspaceRoot();
    if (!root) { return ''; }

    const progressPath = path.join(root, config.files.progressPath);
    try {
        await fsPromises.access(progressPath);
        return await fsPromises.readFile(progressPath, 'utf-8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logError('Failed to read progress.txt', error);
        }
        return '';
    }
}

export async function appendProgressAsync(entry: string): Promise<boolean> {
    const config = getConfig();
    const root = getWorkspaceRoot();
    if (!root) { return false; }

    const progressPath = path.join(root, config.files.progressPath);
    try {
        const timestamp = new Date().toISOString();
        const formattedEntry = `[${timestamp}] ${entry}\n`;
        await fsPromises.appendFile(progressPath, formattedEntry, 'utf-8');
        return true;
    } catch (error) {
        logError('Failed to append to progress.txt', error);
        return false;
    }
}

export async function ensureProgressFileAsync(): Promise<boolean> {
    const config = getConfig();
    const root = getWorkspaceRoot();
    if (!root) { return false; }

    const progressPath = path.join(root, config.files.progressPath);
    try {
        await fsPromises.access(progressPath);
        return true;
    } catch {
        // File doesn't exist, create it
        try {
            await fsPromises.writeFile(progressPath, '# Progress Log\n\n', 'utf-8');
            return true;
        } catch (error) {
            logError('Failed to create progress.txt', error);
            return false;
        }
    }
}

const TASK_PATTERN = /^\s*[-*]\s*\[([ x~!])\]\s*(.+)$/i;
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*$/;

function normalizeHeadingTitle(title: string): string {
    return title.trim().replace(/[\s:.-]+$/, '');
}

function isPhaseHeading(title: string, inTasksSection: boolean, level: number, tasksHeadingLevel: number | null): boolean {
    if (/^phase\b/i.test(title)) {
        return true;
    }

    return inTasksSection && tasksHeadingLevel !== null && level > tasksHeadingLevel;
}

function parseTasksFromContent(content: string): Task[] {
    const tasks: Task[] = [];
    // Normalize line endings: handle CRLF (Windows), LF (Unix), and CR (old Mac)
    const lines = content.split(/\r?\n|\r/);
    let inTasksSection = false;
    let tasksHeadingLevel: number | null = null;
    let currentPhaseTitle: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const headingMatch = HEADING_PATTERN.exec(trimmedLine);

        if (headingMatch) {
            const level = headingMatch[1].length;
            const headingTitle = normalizeHeadingTitle(headingMatch[2]);

            if (/^tasks$/i.test(headingTitle)) {
                inTasksSection = true;
                tasksHeadingLevel = level;
                currentPhaseTitle = undefined;
                continue;
            }

            if (inTasksSection && tasksHeadingLevel !== null && level <= tasksHeadingLevel) {
                inTasksSection = false;
                tasksHeadingLevel = null;
                currentPhaseTitle = undefined;
            }

            if (isPhaseHeading(headingTitle, inTasksSection, level, tasksHeadingLevel)) {
                currentPhaseTitle = headingTitle;
            } else if (!inTasksSection) {
                currentPhaseTitle = undefined;
            }

            continue;
        }

        const match = TASK_PATTERN.exec(line);

        if (match) {
            const marker = match[1].toLowerCase();
            const description = match[2].trim();

            let status: TaskStatus;
            switch (marker) {
                case 'x':
                    status = TaskStatus.COMPLETE;
                    break;
                case '~':
                    status = TaskStatus.IN_PROGRESS;
                    break;
                case '!':
                    status = TaskStatus.BLOCKED;
                    break;
                default:
                    status = TaskStatus.PENDING;
            }

            tasks.push({
                id: `task-${i + 1}`,
                description,
                status,
                lineNumber: i + 1,
                rawLine: line,
                phaseTitle: currentPhaseTitle
            });
        }
    }

    return tasks;
}

function buildProgressSnapshot(tasks: Task[]): ProgressSnapshot {
    const phaseProgress = new Map<string, PhaseProgress>();

    const snapshot: ProgressSnapshot = {
        total: tasks.length,
        completed: 0,
        pending: 0,
        inProgress: 0,
        blocked: 0,
        phases: [],
        completedPhases: 0,
        totalPhases: 0
    };

    for (const task of tasks) {
        switch (task.status) {
            case TaskStatus.COMPLETE:
                snapshot.completed++;
                break;
            case TaskStatus.IN_PROGRESS:
                snapshot.pending++;
                snapshot.inProgress++;
                break;
            case TaskStatus.BLOCKED:
                snapshot.blocked++;
                break;
            default:
                snapshot.pending++;
                break;
        }

        if (!task.phaseTitle) {
            continue;
        }

        const phase = phaseProgress.get(task.phaseTitle) ?? {
            title: task.phaseTitle,
            total: 0,
            completed: 0,
            pending: 0,
            inProgress: 0,
            blocked: 0
        };

        phase.total++;

        switch (task.status) {
            case TaskStatus.COMPLETE:
                phase.completed++;
                break;
            case TaskStatus.IN_PROGRESS:
                phase.pending++;
                phase.inProgress++;
                break;
            case TaskStatus.BLOCKED:
                phase.blocked++;
                break;
            default:
                phase.pending++;
                break;
        }

        if (!phaseProgress.has(task.phaseTitle)) {
            phaseProgress.set(task.phaseTitle, phase);
        }
    }

    snapshot.phases = [...phaseProgress.values()];
    snapshot.totalPhases = snapshot.phases.length;
    snapshot.completedPhases = snapshot.phases.filter(phase => phase.total > 0 && phase.completed === phase.total).length;

    return snapshot;
}

export async function parseTasksAsync(): Promise<Task[]> {
    const content = await readPRDAsync();
    if (!content) { return []; }
    return parseTasksFromContent(content);
}

export async function getProgressSnapshotAsync(): Promise<ProgressSnapshot> {
    const tasks = await parseTasksAsync();
    return buildProgressSnapshot(tasks);
}

export async function getNextTaskAsync(): Promise<Task | null> {
    const tasks = await parseTasksAsync();
    return tasks.find(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS) || null;
}

export async function getTaskStatsAsync(): Promise<{ total: number; completed: number; pending: number }> {
    const snapshot = await getProgressSnapshotAsync();
    return {
        total: snapshot.total,
        completed: snapshot.completed,
        pending: snapshot.pending
    };
}
