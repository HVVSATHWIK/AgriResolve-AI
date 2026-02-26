const normalizedApiBase = (() => {
    const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
    if (!raw) return '/api';
    return raw.endsWith('/api') ? raw : `${raw}/api`;
})();

export const config = {
    apiUrl: normalizedApiBase
};
