import * as assert from 'assert';
import {
    Icons,
    getLogo,
    getHeader,
    getControls,
    getSetupSection,
    getTimelineSection,
    getRequirementsSection,
    getTaskSection,
    getLogSection,
    getFooter,
    getSettingsOverlay
} from '../../webview/templates';
import { Task, TaskStatus } from '../../types';

suite('Webview Templates Test Suite', () => {
    suite('Icons', () => {
        test('should have play icon', () => {
            assert.ok(Icons.play);
            assert.ok(Icons.play.includes('svg'));
        });

        test('should have pause icon', () => {
            assert.ok(Icons.pause);
            assert.ok(Icons.pause.includes('svg'));
        });

        test('should have stop icon', () => {
            assert.ok(Icons.stop);
            assert.ok(Icons.stop.includes('svg'));
        });

        test('should have step icon', () => {
            assert.ok(Icons.step);
            assert.ok(Icons.step.includes('svg'));
        });

        test('should have panel icon', () => {
            assert.ok(Icons.panel);
            assert.ok(Icons.panel.includes('svg'));
        });

        test('should have refresh icon', () => {
            assert.ok(Icons.refresh);
            assert.ok(Icons.refresh.includes('svg'));
        });

        test('should have settings icon', () => {
            assert.ok(Icons.settings);
            assert.ok(Icons.settings.includes('svg'));
        });

        test('should have check icon', () => {
            assert.ok(Icons.check);
            assert.ok(Icons.check.includes('svg'));
        });

        test('should have rocket icon', () => {
            assert.ok(Icons.rocket);
            assert.ok(Icons.rocket.includes('svg'));
        });

        test('should have star icon', () => {
            assert.ok(Icons.star);
            assert.ok(Icons.star.includes('svg'));
        });
    });

    suite('getLogo', () => {
        test('should generate SVG with default size', () => {
            const logo = getLogo();
            assert.ok(logo.includes('svg'));
            assert.ok(logo.includes('width="24"'));
            assert.ok(logo.includes('height="24"'));
        });

        test('should generate SVG with custom size', () => {
            const logo = getLogo(48);
            assert.ok(logo.includes('width="48"'));
            assert.ok(logo.includes('height="48"'));
        });

        test('should include Ralph "R" text', () => {
            const logo = getLogo();
            assert.ok(logo.includes('>R<'));
        });

        test('should include gradient definition', () => {
            const logo = getLogo();
            assert.ok(logo.includes('linearGradient'));
            assert.ok(logo.includes('logoGradient'));
        });

        test('should include circles for the logo shape', () => {
            const logo = getLogo();
            assert.ok(logo.includes('<circle'));
        });
    });

    suite('getHeader', () => {
        test('should generate header HTML', () => {
            const header = getHeader();
            assert.ok(header.includes('class="header'));
            assert.ok(header.includes('id="header"'));
        });

        test('should include status pill', () => {
            const header = getHeader();
            assert.ok(header.includes('status-pill'));
            assert.ok(header.includes('statusText'));
        });

        test('should include timing display', () => {
            const header = getHeader();
            assert.ok(header.includes('timing-display'));
            assert.ok(header.includes('elapsedTime'));
            assert.ok(header.includes('etaTime'));
        });

        test('should include countdown clock', () => {
            const header = getHeader();
            assert.ok(header.includes('countdown'));
            assert.ok(header.includes('clockFill'));
        });

        test('should include Ralph title', () => {
            const header = getHeader();
            assert.ok(header.includes('<h1>Ralph</h1>'));
        });
    });

    suite('getControls', () => {
        test('should generate controls with PRD', () => {
            const controls = getControls(true);
            assert.ok(controls.includes('btnStart'));
            assert.ok(controls.includes('btnPause'));
            assert.ok(controls.includes('btnStop'));
        });

        test('should disable start button when no PRD', () => {
            const controls = getControls(false);
            assert.ok(controls.includes('id="btnStart"'));

            assert.ok(controls.includes('id="btnStart" onclick="send(\'start\')" disabled'));
        });

        test('should enable start button when PRD exists', () => {
            const controls = getControls(true);

            assert.ok(controls.includes('id="btnStart" onclick="send(\'start\')"'));

            const startButtonMatch = controls.match(/id="btnStart"[^>]*>/);
            assert.ok(startButtonMatch !== null);
            assert.ok(!(startButtonMatch?.[0] ?? '').includes('disabled'));
        });

        test('should include step button', () => {
            const controls = getControls(true);
            assert.ok(controls.includes('btnNext'));
        });

        test('should include refresh button', () => {
            const controls = getControls(true);
            assert.ok(controls.includes("send('refresh')"));
        });

        test('should include settings button', () => {
            const controls = getControls(true);
            assert.ok(controls.includes('openSettings()'));
        });

        test('should include optional open panel button for compact views', () => {
            const controls = getControls(true, { showOpenPanelButton: true });
            assert.ok(controls.includes("send('openPanel')"));
            assert.ok(controls.includes('Open Panel'));
        });

        test('should include resume button (hidden by default)', () => {
            const controls = getControls(true);
            assert.ok(controls.includes('btnResume'));
            assert.ok(controls.includes('style="display:none"'));
        });
    });

    suite('getSetupSection', () => {
        test('should generate setup section HTML', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('setup-section'));
        });

        test('should include rocket icon', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('setup-icon'));
        });

        test('should include task input textarea', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('taskInput'));
            assert.ok(setup.includes('textarea'));
        });

        test('should include generate PRD button', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('generatePrd()'));
            assert.ok(setup.includes('generate-btn'));
        });

        test('should include task scope selector', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('taskScope'));
            assert.ok(setup.includes('Small'));
            assert.ok(setup.includes('Medium'));
            assert.ok(setup.includes('Large'));
        });

        test('should include placeholder text', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('placeholder='));
        });

        test('should include description text', () => {
            const setup = getSetupSection();
            assert.ok(setup.includes('setup-description'));
        });
    });

    suite('getTimelineSection', () => {
        test('should generate timeline section HTML', () => {
            const timeline = getTimelineSection();
            assert.ok(timeline.includes('timeline-section'));
        });

        test('should include timeline header', () => {
            const timeline = getTimelineSection();
            assert.ok(timeline.includes('timeline-header'));
            assert.ok(timeline.includes('Task Timeline'));
        });

        test('should include timeline count', () => {
            const timeline = getTimelineSection();
            assert.ok(timeline.includes('timelineCount'));
            assert.ok(timeline.includes('0/0'));
        });

        test('should include timeline phase summary', () => {
            const timeline = getTimelineSection();
            assert.ok(timeline.includes('timelinePhaseSummary'));
        });

        test('should include empty state', () => {
            const timeline = getTimelineSection();
            assert.ok(timeline.includes('timelineEmpty'));
            assert.ok(timeline.includes('No tasks completed yet'));
        });

        test('should include bars and labels containers', () => {
            const timeline = getTimelineSection();
            assert.ok(timeline.includes('timelineBars'));
            assert.ok(timeline.includes('timelineLabels'));
        });
    });

    suite('getRequirementsSection', () => {
        test('should generate requirements section HTML', () => {
            const requirements = getRequirementsSection();
            assert.ok(requirements.includes('requirements-section'));
        });

        test('should include all requirement checkboxes', () => {
            const requirements = getRequirementsSection();
            assert.ok(requirements.includes('reqWriteTests'));
            assert.ok(requirements.includes('reqRunTests'));
            assert.ok(requirements.includes('reqTypeCheck'));
            assert.ok(requirements.includes('reqLinting'));
            assert.ok(requirements.includes('reqDocs'));
            assert.ok(requirements.includes('reqCommit'));
        });

        test('should include toggle functionality', () => {
            const requirements = getRequirementsSection();
            assert.ok(requirements.includes('toggleRequirements()'));
            assert.ok(requirements.includes('reqToggle'));
        });

        test('should include updateRequirements handler', () => {
            const requirements = getRequirementsSection();
            assert.ok(requirements.includes('updateRequirements()'));
        });

        test('should include acceptance criteria header', () => {
            const requirements = getRequirementsSection();
            assert.ok(requirements.includes('Acceptance Criteria'));
        });

        test('should include requirements description', () => {
            const requirements = getRequirementsSection();
            assert.ok(requirements.includes('requirements-desc'));
        });
    });

    suite('getTaskSection', () => {
        test('should show current task when task exists', () => {
            const task: Task = {
                id: 'task-1',
                description: 'Test task description',
                status: TaskStatus.PENDING,
                lineNumber: 1,
                rawLine: '- [ ] Test task description'
            };
            const section = getTaskSection(task, true);
            assert.ok(section.includes('Current Task'));
            assert.ok(section.includes('Test task description'));
            assert.ok(section.includes('task-section active'));
        });

        test('should show completed state when no task and has tasks', () => {
            const section = getTaskSection(null, true);
            assert.ok(section.includes('All tasks completed!'));
            assert.ok(section.includes('empty-state'));
        });

        test('should return empty string when no task and no tasks', () => {
            const section = getTaskSection(null, false);
            assert.strictEqual(section, '');
        });

        test('should include task text element', () => {
            const task: Task = {
                id: 'task-1',
                description: 'Another task',
                status: TaskStatus.IN_PROGRESS,
                lineNumber: 2,
                rawLine: '- [~] Another task'
            };
            const section = getTaskSection(task, true);
            assert.ok(section.includes('taskText'));
        });
    });

    suite('getLogSection', () => {
        test('should generate log section HTML', () => {
            const log = getLogSection();
            assert.ok(log.includes('log-section'));
        });

        test('should include log header with Activity title', () => {
            const log = getLogSection();
            assert.ok(log.includes('log-header'));
            assert.ok(log.includes('Activity'));
        });

        test('should include log area', () => {
            const log = getLogSection();
            assert.ok(log.includes('logArea'));
        });

        test('should include initial log entry', () => {
            const log = getLogSection();
            assert.ok(log.includes('log-entry'));
            assert.ok(log.includes('Ready to start'));
        });
    });

    suite('getFooter', () => {
        test('should generate footer HTML', () => {
            const footer = getFooter();
            assert.ok(footer.includes('footer'));
        });

        test('should include a version badge in the footer', () => {
            const footer = getFooter();
            assert.ok(footer.includes('footer-version'));
            assert.ok(/>v[^<]+</.test(footer));
        });

        test('should include cost warning', () => {
            const footer = getFooter();
            assert.ok(footer.includes('footer-warning'));
            assert.ok(footer.includes('Cost Notice'));
        });

        test('should include GitHub link', () => {
            const footer = getFooter();
            assert.ok(footer.includes('https://github.com/aymenfurter/ralph'));
        });

        test('should include disclaimer', () => {
            const footer = getFooter();
            assert.ok(footer.includes('footer-disclaimer'));
            assert.ok(footer.includes('Not affiliated'));
        });
    });

    suite('getSettingsOverlay', () => {
        test('should generate settings overlay HTML', () => {
            const overlay = getSettingsOverlay();
            assert.ok(overlay.includes('settings-overlay'));
            assert.ok(overlay.includes('settingsOverlay'));
        });

        test('should include settings header', () => {
            const overlay = getSettingsOverlay();
            assert.ok(overlay.includes('settings-header'));
            assert.ok(overlay.includes('Settings'));
        });

        test('should include close button', () => {
            const overlay = getSettingsOverlay();
            assert.ok(overlay.includes('settings-close'));
            assert.ok(overlay.includes('closeSettings()'));
        });

        test('should include max iterations setting', () => {
            const overlay = getSettingsOverlay();
            assert.ok(overlay.includes('settingMaxIterations'));
            assert.ok(overlay.includes('Max iterations'));
        });

        test('should include updateSettings handler', () => {
            const overlay = getSettingsOverlay();
            assert.ok(overlay.includes('updateSettings()'));
        });

        test('should include help text', () => {
            const overlay = getSettingsOverlay();
            assert.ok(overlay.includes('setting-help'));
        });
    });
});
