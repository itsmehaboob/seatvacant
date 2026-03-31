async function commonFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

async function getRouteInfo(trainNumber) {
    if (!trainNumber) {
        throw new Error('Train number is required for route info');
    }
    return commonFetch(`https://www.irctc.co.in/eticketing/protected/mapps1/trnscheduleenquiry/${trainNumber}`, {
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'greq': `${Date.now()}`
        }
    });
}

async function getVacantBerth(body) {
    return commonFetch('https://www.irctc.co.in/online-charts/api/vacantBerth', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}
