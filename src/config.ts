const normalizedApiBase = (() => {
    const azureBase = 'https://agriresolve-ai-azfferc6bff2g6gt.germanywestcentral-01.azurewebsites.net';
    const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
    const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);

    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isHostedApp = host !== 'localhost' && host !== '127.0.0.1';
        if (isHostedApp && isLocalTarget) {
            return `${azureBase}/api`;
        }
    }

    if (!raw) return '/api';
    return raw.endsWith('/api') ? raw : `${raw}/api`;
})();

export const config = {
    apiUrl: normalizedApiBase
};
