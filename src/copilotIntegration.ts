import * as vscode from 'vscode';

export interface CopilotOptions {
    freshChat: boolean;
}

export type FreshChatSessionStartResult = 'started' | 'cancelled' | 'failed';

export async function openCopilotWithPrompt(
    prompt: string,
    options: CopilotOptions = { freshChat: false }
): Promise<'agent' | 'chat' | 'clipboard'> {
    if (options.freshChat) {
        await tryCommand('workbench.action.chat.newEditSession');
    }

    if (await tryCommand('workbench.action.chat.openEditSession', { query: prompt })) {
        return 'agent';
    }

    if (await tryCommand('workbench.action.chat.open', { query: prompt })) {
        return 'chat';
    }

    await vscode.env.clipboard.writeText(prompt);
    vscode.window.showInformationMessage('Ralph: Prompt copied. Paste in Copilot Chat.');
    return 'clipboard';
}

async function tryCommand(command: string, args?: unknown): Promise<boolean> {
    const result = await executeCommand(command, args);
    return result.success;
}

async function executeCommand(
    command: string,
    args?: unknown
): Promise<{ success: true } | { success: false; cancelled: boolean }> {
    try {
        await vscode.commands.executeCommand(command, args);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            cancelled: isCancellationError(error)
        };
    }
}

function isCancellationError(error: unknown): boolean {
    if (error instanceof vscode.CancellationError) {
        return true;
    }

    if (error instanceof Error) {
        return /cancel/i.test(error.name) || /cancel/i.test(error.message);
    }

    return false;
}

export async function startFreshChatSession(): Promise<FreshChatSessionStartResult> {
    const result = await executeCommand('workbench.action.chat.newEditSession');
    if (result.success) {
        return 'started';
    }

    return result.cancelled ? 'cancelled' : 'failed';
}
