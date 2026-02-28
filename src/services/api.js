// API endpoints - will be redirected to Netlify Functions via netlify.toml
export const fetchDomains = async () => {
    const response = await fetch('/api/get-domains');
    if (!response.ok) {
        throw new Error('Failed to fetch domains');
    }
    return response.json();
};

export const saveLink = async (data) => {
    const response = await fetch('/api/save-link', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save link');
    }
    return result;
};

export const batchSaveLinks = async (links) => {
    const response = await fetch('/api/batch-save-links', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to batch save links');
    }
    return result;
};

export const addDomain = async (url) => {
    const response = await fetch('/api/add-domain', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to add domain');
    }
    return result;
};
