import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import "./App.css";

/** ----- Configuration ----- */
const METRICS = [
  { key: "revenue", label: "Revenue" },
  { key: "net_profit", label: "Net Profit" },
  { key: "gross_profit", label: "Gross Profit" },
  { key: "expenses", label: "Expenses" },
];

const TIMEFRAMES = [
  { key: "one_year_monthly", label: "1 Year (Monthly)", freq: "monthly" },
  { key: "three_years_monthly", label: "3 Years (Monthly)", freq: "monthly" },
  { key: "five_years_quarterly", label: "5 Years (Quarterly)", freq: "quarterly" },
  { key: "ten_years_annual", label: "10 Years (Annual)", freq: "annual" },
  { key: "fifteen_years_annual", label: "15 Years (Annual)", freq: "annual" },
];

// One color per metric; historical uses solid, projections dashed with same color
const COLOR_BY_METRIC = {
  revenue: "#1f77b4",
  net_profit: "#2ca02c",
  gross_profit: "#ff7f0e",
  expenses: "#d62728",
};

/** ----- Helpers ----- */
const toQuarter = (ym) => {
  // ym = "YYYY-MM"
  const [y, m] = ym.split("-").map(Number);
  const q = Math.floor((m - 1) / 3) + 1;
  return `${y}-Q${q}`;
};
const toYear = (ym) => ym.split("-")[0];

const labelComparator = (freq) => (a, b) => {
  if (freq === "monthly") {
    // parse YYYY-MM
    const [ya, ma] = a.split("-").map((v) => parseInt(v, 10));
    const [yb, mb] = b.split("-").map((v) => parseInt(v, 10));
    if (ya !== yb) return ya - yb;
    return ma - mb;
  }
  if (freq === "quarterly") {
    // parse "YYYY-Qx"
    const [ya, qa] = a.split("-Q").map((v) => parseInt(v, 10));
    const [yb, qb] = b.split("-Q").map((v) => parseInt(v, 10));
    if (ya !== yb) return ya - yb;
    return qa - qb;
  }
  // annual
  return parseInt(a, 10) - parseInt(b, 10);
};

// aggregate monthly old_data -> desired frequency
function aggregateOldData(oldMonthly, freq) {
  if (!Array.isArray(oldMonthly)) return [];

  if (freq === "monthly") {
    return oldMonthly
      .map((d) => ({
        label: d.month,
        revenue: d.revenue ?? null,
        net_profit: d.net_profit ?? null,
        gross_profit: d.gross_profit ?? null,
        expenses: d.expenses ?? null,
      }))
      .sort((a, b) => labelComparator("monthly")(a.label, b.label));
  }

  // group helper
  const bucketBy = {};
  for (const d of oldMonthly) {
    const label = freq === "quarterly" ? toQuarter(d.month) : toYear(d.month);
    if (!bucketBy[label]) {
      bucketBy[label] = {
        label,
        revenue: 0,
        net_profit: 0,
        gross_profit: 0,
        expenses: 0,
      };
    }
    bucketBy[label].revenue += d.revenue ?? 0;
    bucketBy[label].net_profit += d.net_profit ?? 0;
    bucketBy[label].gross_profit += d.gross_profit ?? 0;
    bucketBy[label].expenses += d.expenses ?? 0;
  }
  return Object.values(bucketBy).sort((a, b) => labelComparator(freq)(a.label, b.label));
}

// normalize projections for any timeframe into {label, ...metrics}
function projectionSeriesForKey(projectionsData, timeframeKey) {
  if (!projectionsData || !projectionsData[timeframeKey]) return { freq: "monthly", rows: [] };

  const rows = projectionsData[timeframeKey].map((d) => {
    if (d.month) {
      return {
        label: d.month,
        revenue: d.revenue ?? null,
        net_profit: d.net_profit ?? null,
        gross_profit: d.gross_profit ?? null,
        expenses: d.expenses ?? null,
      };
    }
    if (d.quarter) {
      return {
        label: d.quarter,
        revenue: d.revenue ?? null,
        net_profit: d.net_profit ?? null,
        gross_profit: d.gross_profit ?? null,
        expenses: d.expenses ?? null,
      };
    }
    // annual {year: number}
    return {
      label: String(d.year),
      revenue: d.revenue ?? null,
      net_profit: d.net_profit ?? null,
      gross_profit: d.gross_profit ?? null,
      expenses: d.expenses ?? null,
    };
  });

  // infer freq from first row key
  const first = projectionsData[timeframeKey][0] || {};
  const freq = first.month ? "monthly" : first.quarter ? "quarterly" : "annual";
  rows.sort((a, b) => labelComparator(freq)(a.label, b.label));
  return { freq, rows };
}

// Merge historical + projections on the same label axis.
// Produces rows like: { label, revenue_hist?, revenue_proj?, ... }
function buildChartRows(histRows, projRows, freq, datasetMode) {
  const byLabel = new Map();

  if (datasetMode === "old" || datasetMode === "both") {
    for (const r of histRows) {
      if (!byLabel.has(r.label)) byLabel.set(r.label, { label: r.label });
      const row = byLabel.get(r.label);
      for (const m of METRICS) row[`${m.key}_hist`] = r[m.key] ?? null;
    }
  }

  if (datasetMode === "proj" || datasetMode === "both") {
    for (const r of projRows) {
      if (!byLabel.has(r.label)) byLabel.set(r.label, { label: r.label });
      const row = byLabel.get(r.label);
      for (const m of METRICS) row[`${m.key}_proj`] = r[m.key] ?? null;
    }
  }

  return Array.from(byLabel.values()).sort((a, b) => labelComparator(freq)(a.label, b.label));
}

function prettyNumber(n) {
  if (n === null || n === undefined) return "";
  return Number(n).toLocaleString();
}

export default function App() {
  const [oldDataFile, setOldDataFile] = useState(null);
  const [projDataFile, setProjDataFile] = useState(null);
  const [oldData, setOldData] = useState(null); // array from data.json.old_data
  const [projections, setProjections] = useState(null); // object from projections.json.projections_data

  const [timeframe, setTimeframe] = useState("one_year_monthly");
  const [datasetMode, setDatasetMode] = useState("both"); // 'old'|'proj'|'both'
  const [selected, setSelected] = useState({
    revenue: true,
    net_profit: true,
    gross_profit: true,
    expenses: true,
  });

  async function readJSONFile(file, onData) {
    const text = await file.text();
    const json = JSON.parse(text);
    onData(json);
  }

  function onUploadOld(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOldDataFile(file);
    readJSONFile(file, (json) => {
      if (!json || !Array.isArray(json.old_data)) {
        alert("data.json must contain { old_data: [...] }");
        return;
      }
      setOldData(json.old_data);
    });
  }
  function onUploadProjections(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProjDataFile(file);
    readJSONFile(file, (json) => {
      if (!json || !json.projections_data) {
        alert("projections.json must contain { projections_data: { ... } }");
        return;
      }
      setProjections(json.projections_data);
    });
  }

  const { freq, histRows, projRows, rows } = useMemo(() => {
    const tf = TIMEFRAMES.find((t) => t.key === timeframe) || TIMEFRAMES[0];

    const hist = oldData ? aggregateOldData(oldData, tf.freq) : [];
    const projPack = projections ? projectionSeriesForKey(projections, timeframe) : { rows: [], freq: tf.freq };

    const merged = buildChartRows(hist, projPack.rows, tf.freq, datasetMode);

    return { freq: tf.freq, histRows: hist, projRows: projPack.rows, rows: merged };
  }, [oldData, projections, timeframe, datasetMode]);

  const filesReady = !!oldData && !!projections;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Projections Visualizer</h1>
        <div className="app__sub">
          Upload your <code>data.json</code> and <code>projections.json</code>, pick a timeframe,
          choose metrics, and compare historical vs projections on one chart.
        </div>
      </header>

      <section className="panel uploads">
        <div className="upload">
          <label className="fileLabel">
            <span className="fileTitle">Upload data.json (historical)</span>
            <input type="file" accept=".json,application/json" onChange={onUploadOld} />
          </label>
          <div className="fileInfo">{oldDataFile ? `Loaded: ${oldDataFile.name}` : "No file yet"}</div>
        </div>

        <div className="upload">
          <label className="fileLabel">
            <span className="fileTitle">Upload projections.json (engine output)</span>
            <input type="file" accept=".json,application/json" onChange={onUploadProjections} />
          </label>
          <div className="fileInfo">{projDataFile ? `Loaded: ${projDataFile.name}` : "No file yet"}</div>
        </div>

        <div className="uploadTips">
          Tip: Historical monthly data is auto-aggregated to quarterly/annual when you pick those timeframes.
        </div>
      </section>

      <section className="panel controls">
        <div className="controlGroup">
          <div className="controlLabel">Timeframe</div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="select"
            disabled={!filesReady}
          >
            {TIMEFRAMES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="controlGroup">
          <div className="controlLabel">Show</div>
          <div className="radioRow">
            {[
              { key: "old", label: "Old only" },
              { key: "proj", label: "Projections only" },
              { key: "both", label: "Both" },
            ].map((opt) => (
              <label key={opt.key} className="radio">
                <input
                  type="radio"
                  name="datasetMode"
                  value={opt.key}
                  checked={datasetMode === opt.key}
                  onChange={(e) => setDatasetMode(e.target.value)}
                  disabled={!filesReady}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="controlGroup">
          <div className="controlLabel">Metrics</div>
          <div className="checks">
            {METRICS.map((m) => (
              <label key={m.key} className="check">
                <input
                  type="checkbox"
                  checked={!!selected[m.key]}
                  onChange={(e) => setSelected((s) => ({ ...s, [m.key]: e.target.checked }))}
                  disabled={!filesReady}
                />
                <span style={{ borderColor: COLOR_BY_METRIC[m.key] }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="panel chartPanel">
        {!filesReady ? (
          <div className="placeholder">
            <div>Waiting for files…</div>
            <div>Upload both <code>data.json</code> and <code>projections.json</code> to render the chart.</div>
          </div>
        ) : (
          <>
            <div className="chartHeader">
              <div>
                <b>X-axis:</b> {freq === "monthly" ? "Month" : freq === "quarterly" ? "Quarter" : "Year"}
              </div>
              <div className="counts">
                <span>{histRows.length} historical points</span>
                <span>{projRows.length} projection points</span>
              </div>
            </div>

            <div className="chartWrap">
              <ResponsiveContainer width="100%" height={460}>
                <LineChart data={rows} margin={{ top: 10, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={prettyNumber} width={90} />
                  <Tooltip
                    formatter={(value, name) => [prettyNumber(value), name]}
                    labelFormatter={(l) => `Period: ${l}`}
                  />
                  <Legend />

                  {METRICS.filter((m) => selected[m.key]).map((m) => (
                    <Line
                      key={`${m.key}-hist`}
                      type="monotone"
                      dataKey={`${m.key}_hist`}
                      name={`${m.label} (Old)`}
                      stroke={COLOR_BY_METRIC[m.key]}
                      strokeWidth={2}
                      dot={false}
                      hide={datasetMode === "proj"}
                    />
                  ))}
                  {METRICS.filter((m) => selected[m.key]).map((m) => (
                    <Line
                      key={`${m.key}-proj`}
                      type="monotone"
                      dataKey={`${m.key}_proj`}
                      name={`${m.label} (Proj)`}
                      stroke={COLOR_BY_METRIC[m.key]}
                      strokeWidth={2}
                      strokeDasharray="6 6"
                      dot={false}
                      hide={datasetMode === "old"}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>

      <footer className="footer">
        <span>Built with React + Recharts. Drop in your JSON and go.</span>
      </footer>
    </div>
  );
}
