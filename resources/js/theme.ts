/**
 * Theme detection and application
 * Automatically detects system dark mode preference and applies it
 */
export function initializeTheme(): void {
    const appearance = getAppearancePreference();

    if (appearance === 'system') {
        applySystemTheme();
    }
}

function getAppearancePreference(): string {
    // This would typically come from a meta tag or config
    const metaTag = document.querySelector('meta[name="appearance"]');
    return metaTag?.getAttribute('content') ?? 'system';
}

function applySystemTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
        document.documentElement.classList.add('dark');
    }
}

// Initialize theme when script loads
initializeTheme();
