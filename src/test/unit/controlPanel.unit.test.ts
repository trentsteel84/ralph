import * as assert from 'assert';
import * as sinon from 'sinon';

const moduleLoader = require('module') as {
    _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const originalLoad = moduleLoader._load;

moduleLoader._load = ((request: string, parent: unknown, isMain: boolean) => {
    if (request === 'vscode') {
        return {};
    }

    return originalLoad(request, parent, isMain);
}) as typeof moduleLoader._load;

const fileUtils = require('../../fileUtils') as typeof import('../../fileUtils');
const { generateRalphHtmlAsync } = require('../../controlPanel') as typeof import('../../controlPanel');

moduleLoader._load = originalLoad;

describe('Control panel HTML', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('keeps the PRD generation setup visible when a PRD already exists', async () => {
        sinon.stub(fileUtils, 'getProgressSnapshotAsync').resolves({
            total: 3,
            completed: 1,
            pending: 2,
            inProgress: 0,
            blocked: 0,
            phases: [],
            completedPhases: 0,
            totalPhases: 0
        });
        sinon.stub(fileUtils, 'getNextTaskAsync').resolves(null);
        sinon.stub(fileUtils, 'readPRDAsync').resolves('# Existing PRD');

        const html = await generateRalphHtmlAsync('sidebar');

        assert.ok(html.includes('taskInput'));
        assert.ok(html.includes('Generate PRD & Tasks'));
        assert.ok(html.includes('Acceptance Criteria'));
    });
});