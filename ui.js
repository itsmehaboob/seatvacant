function display(results, from, to, map) {
    const tbody = document.querySelector('#resultTable tbody');
    tbody.innerHTML = '';

    if (!results.length) {
        tbody.innerHTML = '<tr><td colspan="6">No results</td></tr>';
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

        const tr = document.createElement('tr');

        tr.innerHTML = `
        <td>${r.coachName}</td>
        <td>${r.berthNumber}</td>
        <td>${r.berthCode}</td>
        <td>${r.from} → ${r.to}</td>
        <td>${usableFrom} → ${usableTo}</td>
        <td><span class="badge ${r.match === 100 ? 'full' : 'partial'}">${r.match}%</span></td>
        `;

        tbody.appendChild(tr);
    });
}

function sortTable(col) {
    const table = document.getElementById("resultTable");
    let switching = true;
    let dir = "desc";

    while (switching) {
        switching = false;
        let rows = table.rows;

        for (let i = 1; i < rows.length - 1; i++) {
            let shouldSwitch = false;
            let x = rows[i].getElementsByTagName("TD")[col];
            let y = rows[i + 1].getElementsByTagName("TD")[col];

            if (dir === "asc" && x.innerText > y.innerText) shouldSwitch = true;
            if (dir === "desc" && x.innerText < y.innerText) shouldSwitch = true;

            if (shouldSwitch) {
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }

        if (!switching && dir === "desc") {
            dir = "asc";
            switching = true;
        }
    }
}

function filterTable() {
    const input = document.getElementById("search");
    const filter = input.value.toUpperCase();
    const rows = document.querySelectorAll("#resultTable tbody tr");

    rows.forEach(row => {
        const text = row.innerText.toUpperCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}