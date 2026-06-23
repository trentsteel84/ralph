const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REQUIRED_LOCAL_PACKAGES = require(path.join(ROOT, 'src', 'install-toolchain-packages.json'));

const REQUIRED_COMPILED_OUTPUTS = [
    path.join(ROOT, 'out', 'extension.js')
];

const POST_INSTALL_RELOAD_REMINDER = 'Ralph installed into VS Code Insiders. Reload any open Insiders windows to use the new build.';

function quoteWindowsArgument(argument) {
    if (!/[\s"]/u.test(argument)) {
        return argument;
    }

    const escaped = argument.replace(/"/g, '""');
    return `"${escaped}"`;
}

function normalizeSpawnCommand(command, args, platform = process.platform) {
    if (platform !== 'win32') {
        return { command, args };
    }

    const commandLine = [command, ...args].map(quoteWindowsArgument).join(' ');
    return {
        command: process.env.comspec || 'cmd.exe',
        args: ['/d', '/s', '/c', commandLine]
    };
}

function getCliExecutable(baseName) {
    return process.platform === 'win32' ? `${baseName}.cmd` : baseName;
}

function getVsixPath(version, cwd = ROOT) {
    return path.join(cwd, 'dist', `ralph-${version}.vsix`);
}

function buildPackageCommand(version, cwd = ROOT, platform = process.platform) {
    return {
        command: getCliExecutable('npx', platform),
        args: ['--yes', '@vscode/vsce', 'package', '--out', getVsixPath(version, cwd)]
    };
}

function buildInstallCommand(vsixPath, platform = process.platform) {
    return {
        command: getCliExecutable('code-insiders', platform),
        args: ['--install-extension', vsixPath]
    };
}

function hasLocalPackage(packageName) {
    return fs.existsSync(path.join(ROOT, 'node_modules', ...packageName.split('/')));
}

function hasCompiledOutput() {
    return REQUIRED_COMPILED_OUTPUTS.every(outputPath => fs.existsSync(outputPath));
}

function ensureLocalDependencies(options = {}) {
    const writeLine = options.writeLine ?? console.log;
    const missingPackages = REQUIRED_LOCAL_PACKAGES.filter(packageName => !hasLocalPackage(packageName));
    if (missingPackages.length === 0) {
        return true;
    }

    const packageList = missingPackages.join(', ');

    if (options.allowExistingBuild === true && hasCompiledOutput()) {
        writeLine(
            `Local toolchain packages are missing (${packageList}). Reusing the existing compiled output in out/. Run "npm ci" later if you need to rebuild before packaging.`
        );
        return false;
    }

    throw new Error(
        `Missing local toolchain packages (${packageList}). Run "npm ci" in the repository root, then rerun this packaging command.`
    );
}

function runCommand(command, args, failureMessage) {
    const normalized = normalizeSpawnCommand(command, args);
    const result = spawnSync(normalized.command, normalized.args, {
        cwd: ROOT,
        stdio: 'inherit'
    });

    if (result.error) {
        throw new Error(`${failureMessage}: ${result.error.message}`);
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function compileExtension() {
    console.log('Compiling Ralph before packaging...');
    runCommand(getCliExecutable('npm'), ['run', 'compile'], 'Failed to compile the extension');
}

function runPackagingWorkflow(action, options = {}) {
    const cwd = options.cwd ?? ROOT;
    const platform = options.platform ?? process.platform;
    const version = options.version ?? process.env.npm_package_version;
    const writeLine = options.writeLine ?? console.log;
    const ensureDir = options.ensureDir ?? ((targetPath) => fs.mkdirSync(targetPath, { recursive: true }));
    const runCommandFn = options.runCommand ?? runCommand;

    if (!version) {
        throw new Error('Missing npm_package_version. Run this workflow through an npm script.');
    }

    const vsixPath = getVsixPath(version, cwd);
    ensureDir(path.dirname(vsixPath));

    const packageCommand = buildPackageCommand(version, cwd, platform);
    writeLine(`Packaging Ralph into ${vsixPath}...`);
    runCommandFn(packageCommand.command, packageCommand.args, 'Failed to package the extension for VS Code Insiders');

    if (action === 'package') {
        writeLine(`Created ${vsixPath}`);
        return;
    }

    const installCommand = buildInstallCommand(vsixPath, platform);
    writeLine(`Installing ${vsixPath} into VS Code Insiders...`);
    runCommandFn(installCommand.command, installCommand.args, 'Failed to install the VSIX into VS Code Insiders');

    writeLine(POST_INSTALL_RELOAD_REMINDER);
}

function runBootstrapWorkflow(action, options = {}) {
    const writeLine = options.writeLine ?? console.log;
    const ensureLocalDependenciesFn = options.ensureLocalDependenciesFn ?? ensureLocalDependencies;
    const compileExtensionFn = options.compileExtensionFn ?? compileExtension;
    const runPackagingWorkflowFn = options.runPackagingWorkflowFn ?? runPackagingWorkflow;

    const shouldCompile = ensureLocalDependenciesFn({
        allowExistingBuild: true,
        writeLine
    });

    if (shouldCompile) {
        compileExtensionFn();
    }

    runPackagingWorkflowFn(action, options);
}

function main() {
    const action = process.argv[2] === 'package' ? 'package' : 'install';
    runBootstrapWorkflow(action);
}

module.exports = {
    ROOT,
    POST_INSTALL_RELOAD_REMINDER,
    REQUIRED_LOCAL_PACKAGES,
    REQUIRED_COMPILED_OUTPUTS,
    getCliExecutable,
    normalizeSpawnCommand,
    getVsixPath,
    buildPackageCommand,
    buildInstallCommand,
    hasLocalPackage,
    hasCompiledOutput,
    ensureLocalDependencies,
    runCommand,
    compileExtension,
    runPackagingWorkflow,
    runBootstrapWorkflow,
    main
};

if (require.main === module) {
    try {
        main();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Ralph install workflow failed: ${message}`);
        process.exit(1);
    }
}
