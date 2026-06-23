import * as assert from 'assert';
import * as path from 'path';

import {
    POST_INSTALL_RELOAD_REMINDER,
    REQUIRED_LOCAL_INSTALL_PACKAGES,
    buildInstallCommand,
    buildPackageCommand,
    getCliExecutable,
    getVsixPath,
    normalizeSpawnSpec,
    runInstallWorkflow
} from '../../install';

const installWorkflow = require(path.join(__dirname, '..', '..', '..', 'scripts', 'install-workflow.cjs')) as {
    REQUIRED_LOCAL_PACKAGES: string[];
};

describe('Install workflow', () => {
    it('tracks the local packages required to rebuild before packaging', () => {
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('typescript'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('@types/node'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('@types/vscode'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('@types/mocha'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('@types/sinon'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('@vscode/test-electron'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('glob'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('mocha'));
        assert.ok(REQUIRED_LOCAL_INSTALL_PACKAGES.includes('sinon'));
        assert.deepStrictEqual(REQUIRED_LOCAL_INSTALL_PACKAGES, installWorkflow.REQUIRED_LOCAL_PACKAGES);
    });

    it('uses .cmd executables on Windows', () => {
        assert.strictEqual(getCliExecutable('npx', 'win32'), 'npx.cmd');
        assert.strictEqual(getCliExecutable('code-insiders', 'win32'), 'code-insiders.cmd');
    });

    it('uses bare executable names on non-Windows platforms', () => {
        assert.strictEqual(getCliExecutable('npx', 'linux'), 'npx');
        assert.strictEqual(getCliExecutable('code-insiders', 'darwin'), 'code-insiders');
    });

    it('normalizes Windows command execution through cmd.exe', () => {
        const normalized = normalizeSpawnSpec({
            command: 'npm.cmd',
            args: ['run', 'compile']
        }, 'win32');

        assert.strictEqual(normalized.command.toLowerCase().endsWith('cmd.exe'), true);
        assert.deepStrictEqual(normalized.args, ['/d', '/s', '/c', 'npm.cmd run compile']);
    });

    it('builds a versioned VSIX path inside dist', () => {
        const vsixPath = getVsixPath('1.2.3', '/repo');
        assert.strictEqual(vsixPath, path.join('/repo', 'dist', 'ralph-1.2.3.vsix'));
    });

    it('builds the packaging command with @vscode/vsce', () => {
        const command = buildPackageCommand('1.2.3', '/repo', 'linux');
        assert.strictEqual(command.command, 'npx');
        assert.deepStrictEqual(command.args, ['--yes', '@vscode/vsce', 'package', '--out', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')]);
    });

    it('builds the VS Code Insiders install command for a VSIX', () => {
        const command = buildInstallCommand('/repo/dist/ralph-1.2.3.vsix', 'linux');
        assert.strictEqual(command.command, 'code-insiders');
        assert.deepStrictEqual(command.args, ['--install-extension', '/repo/dist/ralph-1.2.3.vsix']);
    });

    it('packages and installs before printing the reload reminder', () => {
        const messages: string[] = [];
        const ensuredDirectories: string[] = [];
        const executed: Array<{ command: string; args: string[]; cwd: string }> = [];

        const exitCode = runInstallWorkflow('install', {
            cwd: '/repo',
            version: '1.2.3',
            platform: 'linux',
            ensureDir: (targetPath) => {
                ensuredDirectories.push(targetPath);
            },
            runCommand: (spec, cwd) => {
                executed.push({ command: spec.command, args: spec.args, cwd });
                return { status: 0 };
            },
            writeLine: (message) => {
                messages.push(message);
            },
            writeError: (message) => {
                messages.push(`ERROR: ${message}`);
            }
        });

        assert.strictEqual(exitCode, 0);
        assert.deepStrictEqual(ensuredDirectories, [path.join('/repo', 'dist')]);
        assert.strictEqual(executed.length, 2);
        assert.deepStrictEqual(executed[0], {
            command: 'npx',
            args: ['--yes', '@vscode/vsce', 'package', '--out', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')],
            cwd: '/repo'
        });
        assert.deepStrictEqual(executed[1], {
            command: 'code-insiders',
            args: ['--install-extension', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')],
            cwd: '/repo'
        });
        assert.strictEqual(messages[messages.length - 1], POST_INSTALL_RELOAD_REMINDER);
    });

    it('stops after packaging failure without attempting install', () => {
        const executed: Array<{ command: string; args: string[]; cwd: string }> = [];
        const errors: string[] = [];

        const exitCode = runInstallWorkflow('install', {
            cwd: '/repo',
            version: '1.2.3',
            platform: 'linux',
            ensureDir: () => undefined,
            runCommand: (spec, cwd) => {
                executed.push({ command: spec.command, args: spec.args, cwd });
                return { status: 1, error: new Error('packaging failed') };
            },
            writeLine: () => undefined,
            writeError: (message) => {
                errors.push(message);
            }
        });

        assert.strictEqual(exitCode, 1);
        assert.strictEqual(executed.length, 1);
        assert.deepStrictEqual(errors, ['packaging failed']);
    });
});
