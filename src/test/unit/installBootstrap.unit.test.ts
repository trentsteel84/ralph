import * as assert from 'assert';
import * as path from 'path';

type InstallWorkflowModule = {
    ROOT: string;
    POST_INSTALL_RELOAD_REMINDER: string;
    REQUIRED_LOCAL_PACKAGES: string[];
    REQUIRED_COMPILED_OUTPUTS: string[];
    getCliExecutable: (baseName: string) => string;
    normalizeSpawnCommand: (command: string, args: string[], platform?: string) => { command: string; args: string[] };
    getVsixPath: (version: string, cwd?: string) => string;
    buildPackageCommand: (version: string, cwd?: string, platform?: string) => { command: string; args: string[] };
    buildInstallCommand: (vsixPath: string, platform?: string) => { command: string; args: string[] };
    hasLocalPackage: (packageName: string) => boolean;
    hasCompiledOutput: () => boolean;
    ensureLocalDependencies: (options?: { allowExistingBuild?: boolean; writeLine?: (message: string) => void }) => boolean;
    runPackagingWorkflow: (action: 'package' | 'install', options?: {
        cwd?: string;
        platform?: string;
        version?: string;
        writeLine?: (message: string) => void;
        ensureDir?: (targetPath: string) => void;
        runCommand?: (command: string, args: string[], failureMessage: string) => void;
    }) => void;
    runBootstrapWorkflow: (action: 'package' | 'install', options?: {
        writeLine?: (message: string) => void;
        ensureLocalDependenciesFn?: (options: { allowExistingBuild?: boolean; writeLine?: (message: string) => void }) => boolean;
        compileExtensionFn?: () => void;
        runPackagingWorkflowFn?: (action: 'package' | 'install', options?: Record<string, unknown>) => void;
    }) => void;
};

const installWorkflow = require(path.join(__dirname, '..', '..', '..', 'scripts', 'install-workflow.cjs')) as InstallWorkflowModule;

describe('Install bootstrap workflow', () => {
    it('exports the expected preflight package list', () => {
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('typescript'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('@types/node'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('@types/vscode'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('@types/mocha'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('@types/sinon'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('@vscode/test-electron'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('glob'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('mocha'));
        assert.ok(installWorkflow.REQUIRED_LOCAL_PACKAGES.includes('sinon'));
    });

    it('resolves the repository root from the script location', () => {
        assert.strictEqual(installWorkflow.ROOT, path.join(__dirname, '..', '..', '..'));
    });

    it('tracks the compiled outputs needed for fallback packaging', () => {
        assert.deepStrictEqual(installWorkflow.REQUIRED_COMPILED_OUTPUTS, [
            path.join(installWorkflow.ROOT, 'out', 'extension.js')
        ]);
        assert.strictEqual(installWorkflow.hasCompiledOutput(), true);
    });

    it('builds a versioned VSIX path and packaging commands for the root workflow', () => {
        const vsixPath = installWorkflow.getVsixPath('1.2.3', '/repo');
        assert.strictEqual(vsixPath, path.join('/repo', 'dist', 'ralph-1.2.3.vsix'));
        assert.deepStrictEqual(installWorkflow.buildPackageCommand('1.2.3', '/repo', 'linux'), {
            command: 'npx',
            args: ['--yes', '@vscode/vsce', 'package', '--out', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')]
        });
        assert.deepStrictEqual(installWorkflow.buildInstallCommand(vsixPath, 'linux'), {
            command: 'code-insiders',
            args: ['--install-extension', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')]
        });
        assert.match(installWorkflow.POST_INSTALL_RELOAD_REMINDER, /Reload any open Insiders windows/);
    });

    it('normalizes Windows command execution through cmd.exe', () => {
        const normalized = installWorkflow.normalizeSpawnCommand('npm.cmd', ['run', 'compile'], 'win32');

        assert.strictEqual(normalized.command.toLowerCase().endsWith('cmd.exe'), true);
        assert.deepStrictEqual(normalized.args, ['/d', '/s', '/c', 'npm.cmd run compile']);
    });

    it('reports the current workspace as missing local packages before bootstrap', () => {
        assert.strictEqual(installWorkflow.hasLocalPackage('typescript'), false);
        assert.throws(
            () => installWorkflow.ensureLocalDependencies(),
            /Run "npm ci" in the repository root/
        );
    });

    it('allows packaging to reuse the existing compiled output when requested', () => {
        const messages: string[] = [];

        const shouldCompile = installWorkflow.ensureLocalDependencies({
            allowExistingBuild: true,
            writeLine: (message) => {
                messages.push(message);
            }
        });

        assert.strictEqual(shouldCompile, false);
        assert.match(messages[0], /Reusing the existing compiled output in out\//);
    });

    it('packages and installs directly from the root workflow script', () => {
        const messages: string[] = [];
        const ensuredDirectories: string[] = [];
        const commandCalls: Array<{ command: string; args: string[]; failureMessage: string }> = [];

        installWorkflow.runPackagingWorkflow('install', {
            cwd: '/repo',
            version: '1.2.3',
            platform: 'linux',
            writeLine: (message) => {
                messages.push(message);
            },
            ensureDir: (targetPath) => {
                ensuredDirectories.push(targetPath);
            },
            runCommand: (command, args, failureMessage) => {
                commandCalls.push({ command, args, failureMessage });
            }
        });

        assert.deepStrictEqual(ensuredDirectories, [path.join('/repo', 'dist')]);
        assert.deepStrictEqual(commandCalls, [
            {
                command: 'npx',
                args: ['--yes', '@vscode/vsce', 'package', '--out', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')],
                failureMessage: 'Failed to package the extension for VS Code Insiders'
            },
            {
                command: 'code-insiders',
                args: ['--install-extension', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')],
                failureMessage: 'Failed to install the VSIX into VS Code Insiders'
            }
        ]);
        assert.strictEqual(messages[messages.length - 1], installWorkflow.POST_INSTALL_RELOAD_REMINDER);
    });

    it('creates only the VSIX when invoked in package mode', () => {
        const messages: string[] = [];
        const commandCalls: Array<{ command: string; args: string[]; failureMessage: string }> = [];

        installWorkflow.runPackagingWorkflow('package', {
            cwd: '/repo',
            version: '1.2.3',
            platform: 'linux',
            writeLine: (message) => {
                messages.push(message);
            },
            ensureDir: () => undefined,
            runCommand: (command, args, failureMessage) => {
                commandCalls.push({ command, args, failureMessage });
            }
        });

        assert.deepStrictEqual(commandCalls, [
            {
                command: 'npx',
                args: ['--yes', '@vscode/vsce', 'package', '--out', path.join('/repo', 'dist', 'ralph-1.2.3.vsix')],
                failureMessage: 'Failed to package the extension for VS Code Insiders'
            }
        ]);
        assert.strictEqual(messages[messages.length - 1], `Created ${path.join('/repo', 'dist', 'ralph-1.2.3.vsix')}`);
    });

    it('skips compile and still packages when preflight reuses compiled output', () => {
        const executionOrder: string[] = [];
        const messages: string[] = [];

        installWorkflow.runBootstrapWorkflow('install', {
            writeLine: (message) => {
                messages.push(message);
            },
            ensureLocalDependenciesFn: (options) => {
                executionOrder.push(`preflight:${String(options.allowExistingBuild)}`);
                options.writeLine?.('Reusing compiled output');
                return false;
            },
            compileExtensionFn: () => {
                executionOrder.push('compile');
            },
            runPackagingWorkflowFn: (action) => {
                executionOrder.push(`package:${action}`);
            }
        });

        assert.deepStrictEqual(executionOrder, ['preflight:true', 'package:install']);
        assert.deepStrictEqual(messages, ['Reusing compiled output']);
    });

    it('compiles before packaging when local dependencies are available', () => {
        const executionOrder: string[] = [];

        installWorkflow.runBootstrapWorkflow('package', {
            ensureLocalDependenciesFn: () => {
                executionOrder.push('preflight');
                return true;
            },
            compileExtensionFn: () => {
                executionOrder.push('compile');
            },
            runPackagingWorkflowFn: (action) => {
                executionOrder.push(`package:${action}`);
            }
        });

        assert.deepStrictEqual(executionOrder, ['preflight', 'compile', 'package:package']);
    });
});
