import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { TaskRunner } from '../../taskRunner';
import { TaskScope } from '../../types';

suite('TaskRunner PRD generation', () => {
    let executeCommandStub: sinon.SinonStub;
    let showWarningMessageStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;

    setup(() => {
        executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
        showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage');
        showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
    });

    teardown(() => {
        sinon.restore();
    });

    test('starts a fresh chat before sending the PRD prompt', async () => {
        const runner = new TaskRunner();
        const commandCalls: Array<{ command: string; args: unknown }> = [];

        executeCommandStub.callsFake(async (command: string, args?: unknown) => {
            commandCalls.push({ command, args });
            return undefined;
        });

        const method = await runner.triggerPrdGeneration('Build a meal planner app');

        assert.strictEqual(method, 'agent');
        assert.strictEqual(commandCalls.length, 2);
        assert.strictEqual(commandCalls[0].command, 'workbench.action.chat.newEditSession');
        assert.strictEqual(commandCalls[1].command, 'workbench.action.chat.openEditSession');

        const promptArgs = commandCalls[1].args as { query?: string };
        assert.ok(promptArgs.query);
        assert.ok(promptArgs.query?.includes('CREATE PRD.md FILE'));
        assert.ok(promptArgs.query?.includes('SELECTED TASK SCOPE'));
    });

    test('uses a compact flat-task plan for small scope requests', async () => {
        const runner = new TaskRunner();
        const commandCalls: Array<{ command: string; args: unknown }> = [];

        executeCommandStub.callsFake(async (command: string, args?: unknown) => {
            commandCalls.push({ command, args });
            return undefined;
        });

        const method = await runner.triggerPrdGeneration('Add a save button to the settings form', TaskScope.SMALL);

        assert.strictEqual(method, 'agent');
        const promptArgs = commandCalls[1].args as { query?: string };
        assert.ok(promptArgs.query?.includes('Small scope means compact planning'));
        assert.ok(promptArgs.query?.includes('Generate 3-4 tasks'));
        assert.ok(!promptArgs.query?.includes('### Phase 1: Foundation'));
    });

    test('uses phase-oriented planning for large complex requests', async () => {
        const runner = new TaskRunner();
        const commandCalls: Array<{ command: string; args: unknown }> = [];

        executeCommandStub.callsFake(async (command: string, args?: unknown) => {
            commandCalls.push({ command, args });
            return undefined;
        });

        const method = await runner.triggerPrdGeneration(
            'Build a multi-tenant analytics dashboard with frontend and backend changes, API integrations, database migrations, deployment automation, role-based permissions, reporting, and automated testing.',
            TaskScope.LARGE
        );

        assert.strictEqual(method, 'agent');
        const promptArgs = commandCalls[1].args as { query?: string };
        assert.ok(promptArgs.query?.includes('Large scope means phase-based planning'));
        assert.ok(promptArgs.query?.includes('REQUEST COMPLEXITY ASSESSMENT:\ncomplex'));
        assert.ok(promptArgs.query?.includes('### Phase 1: Foundation'));
    });

    test('does not reuse the previous chat when fresh chat startup is cancelled', async () => {
        const runner = new TaskRunner();
        const cancelledError = Object.assign(new Error('Cancelled by user'), { name: 'Canceled' });
        executeCommandStub.onFirstCall().rejects(cancelledError);

        const method = await runner.triggerPrdGeneration('Build a meal planner app');

        assert.strictEqual(method, null);
        assert.strictEqual(executeCommandStub.callCount, 1);
        assert.strictEqual(showWarningMessageStub.calledOnce, true);
        assert.match(showWarningMessageStub.firstCall.args[0], /did not reuse the previous chat session/i);
    });

    test('does not reuse the previous chat when fresh chat startup fails', async () => {
        const runner = new TaskRunner();
        executeCommandStub.onFirstCall().rejects(new Error('chat startup failed'));

        const method = await runner.triggerPrdGeneration('Build a meal planner app');

        assert.strictEqual(method, null);
        assert.strictEqual(executeCommandStub.callCount, 1);
        assert.strictEqual(showErrorMessageStub.calledOnce, true);
        assert.match(showErrorMessageStub.firstCall.args[0], /did not reuse the previous chat session/i);
    });
});