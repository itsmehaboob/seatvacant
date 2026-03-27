function display(results, from, to, map) {
    const container = document.getElementById('results');
    container.innerHTML = '';

    if (!results.length) {
        container.innerHTML = '<div class="no-results">No results</div>';
        return;
    }

    const route = buildRoute();
    const fromIdx = map[from];
    const toIdx = map[to];

    results.forEach(r => {
        const sFrom = map[r.from];
        const sTo = map[r.to];

        const overlapStart = Math.max(sFrom, fromIdx);
        const overlapEnd = Math.min(sTo, toIdx);

        const usableFrom = route[overlapStart]?.code || '';
        const usableTo = route[overlapEnd]?.code || '';

        const div = document.createElement('div');
        div.className = 'result';

        div.innerHTML = `
            <div class="result-item"><strong>Coach:</strong> ${r.coachName}</div>
            <div class="result-item"><strong>Berth:</strong> ${r.berthNumber} (${r.berthCode})</div>
            <div class="result-item"><strong>Available:</strong> ${r.from} → ${r.to}</div>
            <div class="result-item"><strong>Your Use:</strong> ${usableFrom} → ${usableTo}</div>
            <div class="result-item"><strong>Match:</strong> <span class="badge ${r.match === 100 ? 'full' : 'partial'}">${r.match}%</span></div>
        `;

        container.appendChild(div);
    });
}

function filterTable() {
    const input = document.getElementById("search");
    const filter = input.value.toUpperCase();
    const results = document.querySelectorAll("#results .result");

    results.forEach(result => {
        const text = result.innerText.toUpperCase();
        result.style.display = text.includes(filter) ? "" : "none";
    });
}