const API = "http://localhost:6006/api";

const C = {
  gold: "#d98c0f", teal: "#0f9d8f", pink: "#d9376f",
  violet: "#7b4fd6", text: "#201406", muted: "#5c4a2c",
  grid: "rgba(32,20,6,0.12)"
};
const PALETTE = [C.gold, C.teal, C.violet, C.pink, "#2f7fd6", "#e0762f", "#3f9e4c", "#b39a1f"];

Chart.defaults.color = C.muted;
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.color = C.text;

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
const money = n => "Rs " + Number(n || 0).toLocaleString("en-PK");
const charts = {};

function drawChart(canvasId, type, rows, opts = {}) {
  const labels = rows.map(r => r.label);
  const data   = rows.map(r => Number(r.value));
  const ctx = document.getElementById(canvasId);
  if (charts[canvasId]) charts[canvasId].destroy();

  const isCircular = type === "pie" || type === "doughnut";
  const colors = isCircular ? PALETTE
               : (opts.color || C.gold);

  charts[canvasId] = new Chart(ctx, {
    type: opts.area ? "line" : type,
    data: {
      labels,
      datasets: [{
        label: opts.label || "",
        data,
        backgroundColor: isCircular ? colors
                        : (opts.area ? "rgba(217,140,15,0.18)" : colors),
        borderColor: opts.area ? C.gold : (isCircular ? "#ffffff" : colors),
        borderWidth: isCircular ? 2 : (opts.area ? 2 : 0),
        borderRadius: isCircular ? 0 : 6,
        fill: !!opts.area,
        tension: 0.35,
        pointBackgroundColor: C.gold,
        pointRadius: opts.area ? 3 : 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: opts.horizontal ? "y" : "x",
      plugins: {
        legend: { display: isCircular, position: "bottom",
                  labels: { boxWidth: 12, padding: 12, font: { size: 11 }, color: C.text } },
        tooltip: {
          callbacks: opts.money ? {
            label: c => " " + money(c.raw)
          } : undefined
        }
      },
      scales: isCircular ? {} : {
        x: { grid: { color: C.grid }, ticks: { font: { size: 11 }, color: C.text } },
        y: { grid: { color: C.grid }, ticks: { font: { size: 11 }, color: C.text }, beginAtZero: true }
      }
    }
  });
}

async function checkApi() {
  document.getElementById("apiUrl").textContent = API;
  try {
    await fetchJSON(API.replace("/api", "/"));
    setStatus(true, "API connected");
  } catch (e) {
    setStatus(false, "API offline — is the backend running?");
  }
}
function setStatus(ok, text) {
  document.getElementById("apiDot").className = "dot " + (ok ? "dot-ok" : "dot-bad");
  document.getElementById("apiStatus").textContent = text;
}

async function loadKpis() {
  const row = document.getElementById("kpiRow");
  try {
    const k = await fetchJSON(`${API}/analytics/kpis`);
    const occupancy = k.total_seats ? Math.round((k.seats_sold / k.total_seats) * 1000) / 10 : 0;
    const cards = [
      { label: "Total revenue",     value: money(k.total_revenue),       accent: "gold"   },
      { label: "Confirmed bookings", value: k.total_bookings,             accent: "teal"   },
      { label: "Customers",         value: k.total_customers,            accent: "violet" },
      { label: "Movies showing",    value: k.total_movies,               accent: "pink"   },
      { label: "Seats sold",        value: k.seats_sold,                 accent: "teal"   },
      { label: "Avg rating",        value: `${k.avg_rating}<span class="unit"> /5</span>`, accent: "gold" }
    ];
    row.innerHTML = cards.map(c => `
      <div class="col-6 col-md-4 col-lg-2">
        <div class="kpi accent-${c.accent}">
          <div class="kpi-label">${c.label}</div>
          <div class="kpi-value">${c.value}</div>
        </div>
      </div>`).join("");
  } catch (e) {
    row.innerHTML = `<div class="col-12"><div class="kpi accent-pink">
    <div class="kpi-label">Error</div><div class="kpi-value" style="font-size:14px">${e.message}</div>
    </div></div>`;
  }
}

async function loadCharts() {
  const jobs = [
    ["revenue-by-cinema",        "chartRevenueCinema", "bar",      { money: true, color: C.gold }],
    ["genre-distribution",       "chartGenre",         "doughnut", {}],
    ["top-movies",               "chartTopMovies",     "bar",      { horizontal: true, color: C.teal }],
    ["bookings-trend",           "chartTrend",         "line",     { area: true }],
    ["revenue-by-seat-class",    "chartSeatClass",     "doughnut", { money: true }],
    ["payment-methods",          "chartPayments",      "pie",      {}],
    ["membership-distribution",  "chartMembership",    "pie",      {}],
    ["top-concessions",          "chartConcessions",   "bar",      { color: C.violet }],
    ["peak-hours",               "chartPeak",          "line",     { area: true }],
    ["screen-occupancy",         "chartOccupancy",     "bar",      { horizontal: true, color: C.pink }]
  ];
  for (const [endpoint, canvas, type, opts] of jobs) {
    try {
      const rows = await fetchJSON(`${API}/analytics/${endpoint}`);
      drawChart(canvas, type, rows, opts);
    } catch (e) {
      console.error(`Chart ${endpoint} failed:`, e.message);
    }
  }
}

let SCHEMA = {};

async function initExplorer() {
  SCHEMA = await fetchJSON(`${API}/schema`);
  const sel = document.getElementById("resourceSelect");
  sel.innerHTML = Object.keys(SCHEMA)
    .map(r => `<option value="${r}">${r}</option>`).join("");
  sel.addEventListener("change", () => { buildForm(); loadTable(); });
  document.getElementById("refreshBtn").addEventListener("click", loadTable);
  document.getElementById("resetBtn").addEventListener("click", () => buildForm());
  document.getElementById("recordForm").addEventListener("submit", saveRecord);
  buildForm();
  loadTable();
}

function currentResource() { return document.getElementById("resourceSelect").value; }

async function loadTable() {
  const r = currentResource();
  const thead = document.querySelector("#dataTable thead");
  const tbody = document.querySelector("#dataTable tbody");
  try {
    const [rows, countObj] = await Promise.all([
      fetchJSON(`${API}/${r}`),
      fetchJSON(`${API}/${r}/count`)
    ]);
    document.getElementById("rowCount").textContent = countObj.count;
    if (!rows.length) { thead.innerHTML = ""; tbody.innerHTML = `<tr><td class="text-muted">No rows.</td></tr>`; return; }

    const cols = Object.keys(rows[0]);
    const pk = SCHEMA[r].pk;
    thead.innerHTML = "<tr>" + cols.map(c => `<th>${c}</th>`).join("") + "<th></th></tr>";
    tbody.innerHTML = rows.map(row => {
      const cells = cols.map(c => `<td title="${esc(row[c])}">${esc(row[c])}</td>`).join("");
      const id = row[pk];
      return `<tr>${cells}
        <td class="text-nowrap">
          <button class="row-btn edit" data-id="${id}" title="Edit">✎</button>
          <button class="row-btn del"  data-id="${id}" title="Delete">🗑</button>
        </td></tr>`;
    }).join("");

    tbody.querySelectorAll(".del").forEach(b =>
      b.addEventListener("click", () => deleteRecord(b.dataset.id)));
    tbody.querySelectorAll(".edit").forEach(b =>
      b.addEventListener("click", () => editRecord(rows.find(x => String(x[pk]) === b.dataset.id))));
  } catch (e) {
    tbody.innerHTML = `<tr><td class="form-msg err">${e.message}</td></tr>`;
  }
}

function buildForm(values = {}) {
  const r = currentResource();
  const cols = SCHEMA[r].cols;
  document.getElementById("formFields").innerHTML = cols.map(c => `
    <div>
      <label for="f_${c}">${c}</label>
      <input id="f_${c}" name="${c}" class="form-control form-control-sm"
             value="${values[c] !== undefined && values[c] !== null ? esc(values[c]) : ""}"
             placeholder="${c}" />
    </div>`).join("");
  document.getElementById("editId").value = values[SCHEMA[r].pk] ?? "";
  const editing = values[SCHEMA[r].pk] !== undefined;
  document.getElementById("formTitle").textContent = editing ? `Edit ${r}` : `Add ${r}`;
  document.getElementById("saveBtn").textContent = editing ? "Update record" : "Save record";
  document.getElementById("formMsg").textContent = "";
}

function editRecord(row) { buildForm(row); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }

async function saveRecord(e) {
  e.preventDefault();
  const r = currentResource();
  const id = document.getElementById("editId").value;
  const body = {};
  SCHEMA[r].cols.forEach(c => {
    const v = document.getElementById("f_" + c).value;
    if (v !== "") body[c] = v;
  });
  const msg = document.getElementById("formMsg");
  try {
    const editing = id !== "";
    await fetchJSON(`${API}/${r}${editing ? "/" + id : ""}`, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    msg.className = "form-msg ok mt-2";
    msg.textContent = editing ? "Record updated ✓" : "Record added ✓";
    buildForm();
    loadTable();
    loadKpis(); loadCharts();
  } catch (err) {
    msg.className = "form-msg err mt-2";
    msg.textContent = "Error: " + err.message;
  }
}

async function deleteRecord(id) {
  const r = currentResource();
  if (!confirm(`Delete ${r} #${id}?`)) return;
  const msg = document.getElementById("formMsg");
  try {
    await fetchJSON(`${API}/${r}/${id}`, { method: "DELETE" });
    msg.className = "form-msg ok mt-2";
    msg.textContent = `Deleted ${r} #${id} ✓`;
    loadTable(); loadKpis(); loadCharts();
  } catch (err) {
    msg.className = "form-msg err mt-2";
    msg.textContent = "Error: " + err.message + " (this row may be linked to another record)";
  }
}

function esc(v) {
  if (v === null || v === undefined) return "";
  return String(v).replace(/[&<>"]/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[s]));
}

(async function init() {
  await checkApi();
  loadKpis();
  loadCharts();
  initExplorer().catch(e => console.error("Explorer init failed:", e.message));
})();