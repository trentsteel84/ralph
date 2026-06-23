import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

import { startFreshChatSession } from '../../copilotIntegration';

suite('CopilotIntegration fresh chat startup', () => {
    teardown(() => {
        sinon.restore();
    });

    test('returns started when a new chat session command succeeds', async () => {
        sinon.stub(vscode.commands, 'executeCommand').resolves(undefined);

        const result = await startFreshChatSession();

        assert.strictEqual(result, 'started');
    });

    test('returns cancelled when the new chat session command is cancelled', async () => {
        const cancelledError = Object.assign(new Error('Cancelled by user'), { name: 'Canceled' });
        sinon.stub(vscode.commands, 'executeCommand').rejects(cancelledError);

        const result = await startFreshChatSession();

        assert.strictEqual(result, 'cancelled');
    });

    test('returns failed when the new chat session command throws a non-cancellation error', async () => {
        sinon.stub(vscode.commands, 'executeCommand').rejects(new Error('chat startup failed'));

        const result = await startFreshChatSession();

        assert.strictEqual(result, 'failed');
    });
});
