let stationData = {};

const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');
        } catch (err) {
            console.warn('Service Worker registration failed', err);
        }
    }
};

window.addEventListener('load', () => {
    registerServiceWorker();

    // Prefill date with today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    fetch('stations.json')
        .then(res => res.json())
        .then(data => {
            stationData = data;
            populateDropdowns();
        })
        .catch(err => {
            console.error("Failed to load stations.json", err);
            alert("Error loading station data");
        });
});

// Build full route
function buildRoute() {
    if (!stationData || !stationData.common_start) return [];

    const routeType = document.getElementById('route').value;

    return [
        ...stationData.common_start,
        ...(stationData.routes?.[routeType] || []),
        ...stationData.common_end
    ];
}

// Populate dropdowns
function populateDropdowns() {
    const route = buildRoute();
    if (!route.length) return;

    const from = document.getElementById('from');
    const to = document.getElementById('to');

    from.innerHTML = '';
    to.innerHTML = '';

    route.forEach(s => {
        from.add(new Option(`${s.name} (${s.code})`, s.code));
        to.add(new Option(`${s.name} (${s.code})`, s.code));
    });
}

// Rebuild dropdowns on route change
document.getElementById('route').addEventListener('change', populateDropdowns);

// Create station index map
function getIndexMap(route) {
    const map = {};
    route.forEach((s, i) => map[s.code] = i);
    return map;
}

// Calculate match %
function calculateMatch(seat, fromIdx, toIdx, map) {
    const sFrom = map[seat.from];
    const sTo = map[seat.to];

    // Invalid stations
    if (sFrom === undefined || sTo === undefined) return null;

    // No overlap
    if (sTo <= fromIdx || sFrom >= toIdx) return null;

    const overlapStart = Math.max(sFrom, fromIdx);
    const overlapEnd = Math.min(sTo, toIdx);

    const overlap = overlapEnd - overlapStart;
    const total = toIdx - fromIdx;

    if (total <= 0) return null;

    return Math.round((overlap / total) * 100);
}

// Loading indicator
function setLoading(isLoading) {
    const loader = document.getElementById('loader');
    if (!loader) return;

    if (isLoading) {
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

// Fetch IRCTC data
async function fetchData() {
    setLoading(true);

    const route = buildRoute();
    if (!route.length) {
        setLoading(false);
        alert("Station data not loaded yet");
        return;
    }

    const map = getIndexMap(route);

    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;

    const fromIdx = map[from];
    const toIdx = map[to];

    if (fromIdx >= toIdx) {
        alert("Destination must be after boarding station");
        return;
    }

    const body = {
        trainNo: document.getElementById('trainNo').value,
        boardingStation: from,
        remoteStation: document.getElementById('remoteStation').value,
        trainSourceStation: route[0].code,
        jDate: document.getElementById('date').value,
        cls: document.getElementById('cls').value,
        chartType: document.getElementById('chartType').value,
    };

    let data;

    try {
        const res = await fetch('https://www.irctc.co.in/online-charts/api/vacantBerth', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        data = await res.json();

        if (!data || !data.vbd) {
            alert("No berth data found");
            setLoading(false);
            return;
        }
    } catch (e) {
        console.error(e);
        alert("API call failed (CORS likely). Use proxy later.");
        setLoading(false);
        return;
    }

    processResults(data, route, map, from, to, fromIdx, toIdx);
    setLoading(false);
}

// Process and filter results
function processResults(data, route, map, from, to, fromIdx, toIdx) {
    const results = [];

    const seats = data.vbd || [];

    seats.forEach(seat => {
        const match = calculateMatch(seat, fromIdx, toIdx, map);

        if (match && match > 0) {
            results.push({ ...seat, match });
        }
    });

    results.sort((a, b) => b.match - a.match);

    display(results, from, to, map);
}

// Display results
function display(results, from, to, map) {
    const div = document.getElementById('results');
    div.innerHTML = '';

    if (!results.length) {
        div.innerHTML = "<b>No useful seats found</b>";
        return;
    }

    results.forEach(r => {
        const d = document.createElement('div');
        d.className = 'result ' + (r.match === 100 ? 'full' : 'partial');

        // Calculate usable segment
        const route = buildRoute();
        const fromIdx = map[from];
        const toIdx = map[to];
        const sFrom = map[r.from];
        const sTo = map[r.to];

        const overlapStart = Math.max(sFrom, fromIdx);
        const overlapEnd = Math.min(sTo, toIdx);

        const usableFrom = route[overlapStart]?.code || '';
        const usableTo = route[overlapEnd]?.code || '';

        d.innerHTML = `
        <b>Coach:</b> ${r.coachName} | <b>Berth:</b> ${r.berthNumber} (${r.berthCode})<br/>
        <b>Available:</b> ${r.from} → ${r.to}<br/>
        <b>Your Journey:</b> ${from} → ${to}<br/>
        <b>Your Use:</b> ${usableFrom} → ${usableTo}<br/>
        <b>Match:</b> ${r.match}% ${r.match === 100 ? '(Full)' : '(Partial)'}
        `;

        div.appendChild(d);
    });
}