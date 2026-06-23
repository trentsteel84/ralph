import { spawnSync, SpawnSyncReturns } from 'child_process';
import { readFileSync } from 'fs';
import { mkdirSync } from 'fs';
import * as path from 'path';

export type InstallWorkflowAction = 'package' | 'install';

export interface CommandSpec {
    command: string;
    args: string[];
}

export interface CommandResult {
    status: number | null;
    error?: Error;
}

function quoteWindowsArgument(argument: string): string {
    if (!(/[\s"]/u.test(argument))) {
        return argument;
    }

    return `"${argument.replace(/"/g, '""')}"`;
}

export function normalizeSpawnSpec(spec: CommandSpec, platform: NodeJS.Platform = process.platform): CommandSpec {
    if (platform !== 'win32') {
        return spec;
    }

    const commandLine = [spec.command, ...spec.args].map(quoteWindowsArgument).join(' ');
    return {
        command: process.env.comspec || 'cmd.exe',
        args: ['/d', '/s', '/c', commandLine]
    };
}

export interface InstallWorkflowOptions {
    cwd?: string;
    platform?: NodeJS.Platform;
    version?: string;
    ensureDir?: (targetPath: string) => void;
    runCommand?: (spec: CommandSpec, cwd: string) => CommandResult;
    writeLine?: (message: string) => void;
    writeError?: (message: string) => void;
}

function loadRequiredLocalInstallPackages(): string[] {
    const packagesPath = path.resolve(__dirname, '../src/install-toolchain-packages.json');
    return JSON.parse(readFileSync(packagesPath, 'utf8')) as string[];
}

export const REQUIRED_LOCAL_INSTALL_PACKAGES = loadRequiredLocalInstallPackages();

export const POST_INSTALL_RELOAD_REMINDER = 'Ralph installed into VS Code Insiders. Reload any open Insiders windows to use the new build.';

function runCommandWithSpawn(spec: CommandSpec, cwd: string): CommandResult {
    const normalized = normalizeSpawnSpec(spec);
    const result: SpawnSyncReturns<Buffer> = spawnSync(normalized.command, normalized.args, {
        cwd,
        stdio: 'inherit'
    });

    return {
        status: result.status,
        error: result.error ?? undefined
    };
}

export function getCliExecutable(baseName: string, platform: NodeJS.Platform = process.platform): string {
    return platform === 'win32' ? `${baseName}.cmd` : baseName;
}

export function getVsixPath(version: string, cwd: string = process.cwd()): string {
    return path.join(cwd, 'dist', `ralph-${version}.vsix`);
}

export function buildPackageCommand(version: string, cwd: string = process.cwd(), platform: NodeJS.Platform = process.platform): CommandSpec {
    return {
        command: getCliExecutable('npx', platform),
        args: ['--yes', '@vscode/vsce', 'package', '--out', getVsixPath(version, cwd)]
    };
}

export function buildInstallCommand(vsixPath: string, platform: NodeJS.Platform = process.platform): CommandSpec {
    return {
        command: getCliExecutable('code-insiders', platform),
        args: ['--install-extension', vsixPath]
    };
}

export function runInstallWorkflow(action: InstallWorkflowAction, options: InstallWorkflowOptions = {}): number {
    const cwd = options.cwd ?? process.cwd();
    const platform = options.platform ?? process.platform;
    const version = options.version ?? process.env.npm_package_version;
    const ensureDir = options.ensureDir ?? ((targetPath: string) => mkdirSync(targetPath, { recursive: true }));
    const writeLine = options.writeLine ?? console.log;
    const writeError = options.writeError ?? console.error;
    const runCommand = options.runCommand ?? runCommandWithSpawn;

    if (!version) {
        writeError('Missing npm_package_version. Run this workflow through an npm script.');
        return 1;
    }

    const vsixPath = getVsixPath(version, cwd);
    ensureDir(path.dirname(vsixPath));

    const packageCommand = buildPackageCommand(version, cwd, platform);
    writeLine(`Packaging Ralph into ${vsixPath}...`);
    const packageResult = runCommand(packageCommand, cwd);
    if (packageResult.status !== 0) {
        writeError(packageResult.error?.message ?? 'VSIX packaging failed.');
        return 1;
    }

    if (action === 'package') {
        writeLine(`Created ${vsixPath}`);
        return 0;
    }

    const installCommand = buildInstallCommand(vsixPath, platform);
    writeLine(`Installing ${vsixPath} into VS Code Insiders...`);
    const installResult = runCommand(installCommand, cwd);
    if (installResult.status !== 0) {
        writeError(installResult.error?.message ?? 'VS Code Insiders installation failed.');
        return 1;
    }

    writeLine(POST_INSTALL_RELOAD_REMINDER);
    return 0;
}

if (require.main === module) {
    const action: InstallWorkflowAction = process.argv[2] === 'package' ? 'package' : 'install';
    process.exit(runInstallWorkflow(action));
}
