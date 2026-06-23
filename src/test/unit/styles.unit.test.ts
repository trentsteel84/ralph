import * as assert from 'assert';
import { getStyles } from '../../webview/styles';

describe('Webview Styles', () => {
    describe('getStyles', () => {
        it('should return a string', () => {
            const styles = getStyles();
            assert.strictEqual(typeof styles, 'string');
        });

        it('should include CSS variables', () => {
            const styles = getStyles();
            assert.ok(styles.includes(':root'));
            assert.ok(styles.includes('--gradient-1'));
            assert.ok(styles.includes('--gradient-2'));
            assert.ok(styles.includes('--gradient-3'));
        });

        it('should include header styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.header'));
            assert.ok(styles.includes('.header.idle'));
            assert.ok(styles.includes('.header.running'));
        });

        it('should include button styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('button'));
            assert.ok(styles.includes('button.primary'));
            assert.ok(styles.includes('button.secondary'));
            assert.ok(styles.includes('button.danger'));
        });

        it('should include task section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.task-section'));
            assert.ok(styles.includes('.task-label'));
            assert.ok(styles.includes('.task-text'));
        });

        it('should include log section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.log-section'));
            assert.ok(styles.includes('.log-entry'));
            assert.ok(styles.includes('.log-time'));
        });

        it('should include timeline styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.timeline-section'));
            assert.ok(styles.includes('.timeline-bar'));
            assert.ok(styles.includes('.timeline-bars'));
        });

        it('should include requirements section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.requirements-section'));
            assert.ok(styles.includes('.requirement-item'));
        });

        it('should include settings overlay styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.settings-overlay'));
            assert.ok(styles.includes('.settings-header'));
        });

        it('should include setup section styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.setup-section'));
            assert.ok(styles.includes('.setup-textarea'));
        });

        it('should include countdown styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.countdown'));
            assert.ok(styles.includes('.countdown-clock'));
        });

        it('should include timing display styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.timing-display'));
            assert.ok(styles.includes('.timing-value'));
        });

        it('should include animation keyframes', () => {
            const styles = getStyles();
            assert.ok(styles.includes('@keyframes'));
            assert.ok(styles.includes('gradientShift'));
            assert.ok(styles.includes('shimmer'));
            assert.ok(styles.includes('pulse'));
        });

        it('should include status pill styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.status-pill'));
            assert.ok(styles.includes('.status-dot'));
        });

        it('should include footer styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.footer'));
            assert.ok(styles.includes('.footer-warning'));
            assert.ok(styles.includes('.footer-disclaimer'));
        });

        it('should include empty state styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.empty-state'));
            assert.ok(styles.includes('.empty-state-icon'));
        });

        it('should include VS Code theme variables', () => {
            const styles = getStyles();
            assert.ok(styles.includes('var(--vscode-'));
        });

        it('should include control button spacing', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.controls'));
            assert.ok(styles.includes('.spacer'));
        });

        it('should include compact sidebar layout styles', () => {
            const styles = getStyles();
            assert.ok(styles.includes('.layout-sidebar'));
            assert.ok(styles.includes('.open-panel-btn'));
        });
    });
});
