import { TaskRequirements, TaskScope, DEFAULT_TASK_SCOPE } from './types';
import { readPRDAsync, readProgressAsync, getWorkspaceRoot } from './fileUtils';
import { getConfig } from './config';

const MAX_TASK_DESCRIPTION_LENGTH = 5000;

export function sanitizeTaskDescription(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input.trim().slice(0, MAX_TASK_DESCRIPTION_LENGTH);

    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    sanitized = sanitized.replace(/^```/gm, '\\`\\`\\`');

    return sanitized;
}

interface TemplateVariables {
    task: string;
    prd: string;
    progress: string;
    requirements: string;
    workspace: string;
}

type RequestComplexity = 'simple' | 'moderate' | 'complex';

/**
 * Applies custom template by replacing placeholder variables.
 * Supported placeholders: {{task}}, {{prd}}, {{progress}}, {{requirements}}, {{workspace}}
 */
export function applyCustomTemplate(template: string, variables: TemplateVariables): string {
    return template
        .replace(/\{\{task\}\}/g, variables.task)
        .replace(/\{\{prd\}\}/g, variables.prd)
        .replace(/\{\{progress\}\}/g, variables.progress)
        .replace(/\{\{requirements\}\}/g, variables.requirements)
        .replace(/\{\{workspace\}\}/g, variables.workspace);
}

export async function buildAgentPromptAsync(taskDescription: string, requirements: TaskRequirements): Promise<string> {
    const sanitizedTask = sanitizeTaskDescription(taskDescription);
    const config = getConfig();

    const prd = await readPRDAsync() || '';
    const progress = await readProgressAsync();
    const root = getWorkspaceRoot();

    // Check if custom template is provided
    if (config.prompt.customTemplate && config.prompt.customTemplate.trim()) {
        return applyCustomTemplate(config.prompt.customTemplate, {
            task: sanitizedTask,
            prd: prd,
            progress: progress || '',
            requirements: buildRequirementsSteps(sanitizedTask, requirements).join('\n'),
            workspace: root || ''
        });
    }

    const parts: string[] = [
        '===================================================================',
        '                       YOUR TASK TO IMPLEMENT',
        '===================================================================',
        '',
        sanitizedTask,
        '',
        '===================================================================',
        '           MANDATORY: UPDATE PRD.md AND progress.txt WHEN DONE',
        '═══════════════════════════════════════════════════════════════',
        '',
        '🚨 THESE STEPS ARE REQUIRED - DO NOT SKIP THEM! 🚨',
        '',
        '1. After completing the task, UPDATE PRD.md:',
        '',
        `   Find this line:    - [ ] ${sanitizedTask}`,
        `   Change it to:      - [x] ${sanitizedTask}`,
        '',
        '2. APPEND to progress.txt with what you did:',
        '',
        '   Add a new line describing what was completed, e.g.:',
        `   "Completed: ${sanitizedTask} - [brief summary of changes made]"`,
        '',
        'Both updates are required for Ralph to continue to the next task!',
        '',
        '═══════════════════════════════════════════════════════════════',
        '                      PROJECT CONTEXT',
        '═══════════════════════════════════════════════════════════════',
        '',
        '## Current PRD.md Contents:',
        '```markdown',
        prd,
        '```',
        ''
    ];

    if (progress && progress.trim()) {
        parts.push('## Progress Log (progress.txt):');
        parts.push('This file tracks completed work. Append your progress here when done.');
        parts.push('```');
        parts.push(progress);
        parts.push('```');
        parts.push('');
    } else {
        parts.push('## Progress Log (progress.txt):');
        parts.push('No progress recorded yet. Create or append to progress.txt when you complete this task.');
        parts.push('');
    }

    parts.push('═══════════════════════════════════════════════════════════════');
    parts.push('                       WORKFLOW REMINDER');
    parts.push('═══════════════════════════════════════════════════════════════');
    parts.push('');

    const reqSteps = buildRequirementsSteps(sanitizedTask, requirements);
    parts.push(...reqSteps);
    parts.push('');
    parts.push(`Workspace: ${root}`);
    parts.push('');
    parts.push('Begin now. Remember: updating both PRD.md and progress.txt when done is MANDATORY!');

    return parts.join('\n');
}

function buildRequirementsSteps(taskDescription: string, requirements: TaskRequirements): string[] {
    const reqSteps: string[] = ['1. ✅ Implement the task'];
    let stepNum = 2;

    if (requirements.writeTests) {
        reqSteps.push(`${stepNum}. ✅ Write unit tests for your implementation`);
        stepNum++;
    }
    if (requirements.runTests) {
        reqSteps.push(`${stepNum}. ✅ Run tests and ensure they pass`);
        stepNum++;
    }
    if (requirements.runTypeCheck) {
        reqSteps.push(`${stepNum}. ✅ Run type checking (tsc --noEmit or equivalent)`);
        stepNum++;
    }
    if (requirements.runLinting) {
        reqSteps.push(`${stepNum}. ✅ Run linting and fix any issues`);
        stepNum++;
    }
    if (requirements.updateDocs) {
        reqSteps.push(`${stepNum}. ✅ Update documentation if needed`);
        stepNum++;
    }
    if (requirements.commitChanges) {
        reqSteps.push(`${stepNum}. ✅ Commit your changes with a descriptive message`);
        stepNum++;
    }
    reqSteps.push(`${stepNum}. ✅ UPDATE PRD.md: Change "- [ ] ${taskDescription}" to "- [x] ${taskDescription}"`);
    stepNum++;
    reqSteps.push(`${stepNum}. ✅ APPEND to progress.txt: Record what you completed`);

    return reqSteps;
}

export function buildPrdGenerationPrompt(
    taskDescription: string,
    workspaceRoot: string,
    scope: TaskScope = DEFAULT_TASK_SCOPE
): string {
    const sanitizedTask = sanitizeTaskDescription(taskDescription);
    const config = getConfig();

    if (config.prompt.customPrdGenerationTemplate && config.prompt.customPrdGenerationTemplate.trim()) {
        return applyCustomTemplate(config.prompt.customPrdGenerationTemplate, {
            task: sanitizedTask,
            workspace: workspaceRoot,
            prd: '',
            progress: '',
            requirements: ''
        });
    }

    const complexity = inferRequestComplexity(sanitizedTask);
    const planningInstructions = buildPrdPlanningInstructions(scope, complexity);
    const outputExample = buildPrdTaskStructureExample(scope, complexity);

    return `===================================================================
                       CREATE PRD.md FILE
===================================================================

The user wants to build something. Your job is to create a PRD.md file with a structured task list.

## USER'S REQUEST:
${sanitizedTask}

## SELECTED TASK SCOPE:
${scope}

## REQUEST COMPLEXITY ASSESSMENT:
${complexity}

===================================================================
                    REQUIRED OUTPUT FORMAT
===================================================================

Create a file called \`PRD.md\` in the workspace root with this exact top-level structure:

\`\`\`markdown
# Project Name

## Overview
Brief description of what we're building.

## Tasks
${outputExample}

## Technical Details
Any relevant technical decisions, stack info, etc.
\`\`\`

═══════════════════════════════════════════════════════════════
                    ⚠️ IMPORTANT RULES
═══════════════════════════════════════════════════════════════

1. **Task Format**: Each task MUST use \`- [ ] \` checkbox format (this is how Ralph tracks progress)
2. **Top-level Sections Stay Fixed**: Keep # Project Name, ## Overview, ## Tasks, and ## Technical Details in that order.
3. **Logical Order**: Order tasks or phases so they can be completed sequentially.
4. **Comprehensive Tasks**: Each task should accomplish a meaningful chunk of work, not a tiny implementation detail.
5. **Clear Actions**: Start each task with a verb (Create, Add, Implement, Configure, Integrate, Polish, etc.).
6. **Match Scope and Complexity**: Use the selected scope together with the request complexity when deciding whether to stay with a flat task list or introduce phases.

═══════════════════════════════════════════════════════════════
                    SCOPE-SPECIFIC PLANNING RULES
═══════════════════════════════════════════════════════════════

${planningInstructions}

## GOOD TASKS
- [ ] Set up project structure, dependencies, and core configuration
- [ ] Create the primary data models, contracts, and shared types
- [ ] Implement the main feature flow and supporting services
- [ ] Add user-facing UI, validation, and error handling
- [ ] Write tests, documentation, and release-readiness updates

## BAD TASKS
- [ ] Create package.json (too small, combine with broader setup work)
- [ ] Add button component (too granular, combine with related UI work)
- [ ] List every tiny code edit as its own task (too granular)
- [ ] Use phases for a tiny request that only needs a short checklist (over-structured)

═══════════════════════════════════════════════════════════════

Workspace: ${workspaceRoot}

Now create the PRD.md file based on the user's request above. Make the plan specific, actionable, and appropriately scoped.`;
}

function inferRequestComplexity(taskDescription: string): RequestComplexity {
    const normalized = taskDescription.toLowerCase();
    const wordCount = normalized.split(/\s+/).filter(Boolean).length;
    const signalWords = [
        'api',
        'auth',
        'authentication',
        'backend',
        'billing',
        'cache',
        'ci',
        'database',
        'deploy',
        'deployment',
        'frontend',
        'integration',
        'migration',
        'mobile',
        'permissions',
        'queue',
        'realtime',
        'real-time',
        'reporting',
        'search',
        'server',
        'sync',
        'testing',
        'ui',
        'webhook',
        'worker'
    ];
    const uniqueSignals = new Set(signalWords.filter(signal => normalized.includes(signal)));

    let score = 0;

    if (wordCount >= 35) {
        score++;
    }
    if (wordCount >= 80) {
        score++;
    }
    if (uniqueSignals.size >= 3) {
        score++;
    }
    if (uniqueSignals.size >= 6) {
        score++;
    }
    if ((normalized.includes('frontend') || normalized.includes('ui'))
        && (normalized.includes('backend') || normalized.includes('api') || normalized.includes('database'))) {
        score++;
    }
    if ((normalized.match(/\band\b/g) || []).length >= 3) {
        score++;
    }

    if (score >= 4) {
        return 'complex';
    }

    if (score >= 2) {
        return 'moderate';
    }

    return 'simple';
}

function buildPrdPlanningInstructions(scope: TaskScope, complexity: RequestComplexity): string {
    switch (scope) {
        case TaskScope.SMALL:
            return [
                '- **Small scope means compact planning**: Keep the plan as a flat checklist and do not introduce phases.',
                complexity === 'simple'
                    ? '- **Task count target**: Generate 3-4 tasks.'
                    : '- **Task count target**: Generate 4-5 tasks while combining related work into broader chunks.',
                '- **Shape**: Keep a single checklist directly under ## Tasks with no extra headings.',
                '- **Bias**: Merge related setup, implementation, and verification work instead of splitting into micro-tasks.'
            ].join('\n');
        case TaskScope.LARGE:
            return [
                '- **Large scope means phase-based planning**: Use explicit phase headings inside ## Tasks.',
                complexity === 'complex'
                    ? '- **Phase count target**: Generate 3-5 phases with roughly 2-4 tasks per phase.'
                    : '- **Phase count target**: Generate 2-4 phases with roughly 2-3 tasks per phase.',
                '- **Shape**: Use markdown phase headings such as ### Phase 1: Foundation, then list checkbox tasks under each phase.',
                '- **Bias**: Separate foundation, core implementation, integration, and polish/testing when that improves execution order.'
            ].join('\n');
        case TaskScope.MEDIUM:
        default:
            return [
                '- **Medium scope should adapt to complexity**: Stay flat for simpler requests, but introduce light phase structure when the request is clearly multi-part.',
                complexity === 'simple'
                    ? '- **Task count target**: Generate 4-6 flat tasks with no phase headings.'
                    : '- **Task count target**: Generate 5-8 tasks total. If the work spans multiple subsystems, you may group tasks under 2-3 short phase headings.',
                '- **Shape**: Prefer a flat checklist unless the request includes multiple implementation layers, integrations, or delivery stages.',
                '- **Bias**: Keep the plan readable and execution-friendly. Do not add phases unless they clarify a genuinely broader request.'
            ].join('\n');
    }
}

function buildPrdTaskStructureExample(scope: TaskScope, complexity: RequestComplexity): string {
    const usePhases = scope === TaskScope.LARGE || (scope === TaskScope.MEDIUM && complexity !== 'simple');

    if (usePhases) {
        return [
            '### Phase 1: Foundation',
            '- [ ] Set up the project structure, dependencies, and core architecture',
            '- [ ] Define the main data models, contracts, and shared configuration',
            '',
            '### Phase 2: Core Delivery',
            '- [ ] Implement the primary feature flows and supporting services',
            '- [ ] Connect the main integrations, validation, and error handling',
            '',
            '### Phase 3: Finish and Verify',
            '- [ ] Add tests, documentation, and release-readiness updates'
        ].join('\n');
    }

    return [
        '- [ ] Set up the project structure, dependencies, and core configuration',
        '- [ ] Create the primary data models and shared types',
        '- [ ] Implement the main feature flow and supporting logic',
        '- [ ] Add the user-facing behavior, validation, and error handling',
        '- [ ] Write tests, documentation, and final polish'
    ].join('\n');
}
