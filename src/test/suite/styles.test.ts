import * as assert from 'assert';
import { getStyles } from '../../webview/styles';

suite('Webview Styles Test Suite', () => {
    suite('getStyles', () => {
        test('should return a string', () => {
            const styles = getStyles();
            assert.strictEqual(typeof styles, 'string');
        });

        test('should include CSS variables', () => {
            const styles = getStyles();
            assert.ok(styles.includes(':root'));
            assert.ok(styles.includes('--gradient-1'));
            assert.ok(styles.includes('--gradient-2'));
            assert.ok(styles.includes('--gradient-3'));
        });

        test('should include header styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.header'));
            assert.ok(styles.includes('.header.idle'));
            assert.ok(styles.includes('.header.running'));
        });

        test('should include button styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('button'));
            assert.ok(styles.includes('button.primary'));
            assert.ok(styles.includes('button.secondary'));
            assert.ok(styles.includes('button.danger'));
        });

        test('should include task section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.task-section'));
            assert.ok(styles.includes('.task-label'));
            assert.ok(styles.includes('.task-text'));
        });

        test('should include log section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.log-section'));
            assert.ok(styles.includes('.log-entry'));
            assert.ok(styles.includes('.log-time'));
        });

        test('should include timeline styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.timeline-section'));
            assert.ok(styles.includes('.timeline-bar'));
            assert.ok(styles.includes('.timeline-bars'));
        });

        test('should include requirements section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.requirements-section'));
            assert.ok(styles.includes('.requirement-item'));
        });

        test('should include settings overlay styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.settings-overlay'));
            assert.ok(styles.includes('.settings-header'));
        });

        test('should include setup section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.setup-section'));
            assert.ok(styles.includes('.setup-textarea'));
        });

        test('should include countdown styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.countdown'));
            assert.ok(styles.includes('.countdown-clock'));
        });

        test('should include timing display styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.timing-display'));
            assert.ok(styles.includes('.timing-value'));
        });

        test('should include animation keyframes', () => {
            const styles = getStyles();
            assert.ok(styles.includes('@keyframes'));
            assert.ok(styles.includes('gradientShift'));
            assert.ok(styles.includes('shimmer'));
            assert.ok(styles.includes('pulse'));
        });

        test('should include status pill styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.status-pill'));
            assert.ok(styles.includes('.status-dot'));
        });

        test('should include footer styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.footer'));
            assert.ok(styles.includes('.footer-warning'));
            assert.ok(styles.includes('.footer-disclaimer'));
        });

        test('should include empty state styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.empty-state'));
            assert.ok(styles.includes('.empty-state-icon'));
        });

        test('should include VS Code theme variables', () => {
            const styles = getStyles();
            assert.ok(styles.includes('var(--vscode-'));
        });

        test('should include control button spacing', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.controls'));
            assert.ok(styles.includes('.spacer'));
        });

        test('should include compact sidebar layout styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.layout-sidebar'));
            assert.ok(styles.includes('.open-panel-btn'));
        });
    });
});
