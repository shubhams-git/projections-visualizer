import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar, Toolbar, Container, Typography, Paper, Grid, Stack, Divider,
  Button, IconButton, Tooltip, Chip, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem,
  ToggleButtonGroup, ToggleButton, FormGroup, FormControlLabel, Checkbox,
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Link, Avatar
} from "@mui/material";
import {
  UploadFile as UploadFileIcon,
  DeleteOutline as DeleteOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Insights as InsightsIcon,
  HelpOutline as HelpOutlineIcon,
  RocketLaunch as RocketLaunchIcon,
  Timeline as TimelineIcon,
  Tune as TuneIcon
} from "@mui/icons-material";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { alpha, useTheme, keyframes } from "@mui/material/styles";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend
} from "recharts";

/** ===================== Config (unchanged) ===================== **/
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

// same color for Old (solid) & Proj (dashed) per metric
const COLOR_BY_METRIC = {
  revenue: "#7aa2f7",
  net_profit: "#80cbc4",
  gross_profit: "#ffb86c",
  expenses: "#ef5350",
};

/** ===================== Helpers (unchanged logic) ===================== **/
const toQuarter = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  const q = Math.floor((m - 1) / 3) + 1;
  return `${y}-Q${q}`;
};
const toYear = (ym) => ym.split("-")[0];

const labelComparator = (freq) => (a, b) => {
  if (freq === "monthly") {
    const [ya, ma] = a.split("-").map((v) => parseInt(v, 10));
    const [yb, mb] = b.split("-").map((v) => parseInt(v, 10));
    if (ya !== yb) return ya - yb;
    return ma - mb;
  }
  if (freq === "quarterly") {
    const [ya, qa] = a.split("-Q").map((v) => parseInt(v, 10));
    const [yb, qb] = b.split("-Q").map((v) => parseInt(v, 10));
    if (ya !== yb) return ya - yb;
    return qa - qb;
  }
  return parseInt(a, 10) - parseInt(b, 10);
};

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
  const bucketBy = {};
  for (const d of oldMonthly) {
    const label = freq === "quarterly" ? toQuarter(d.month) : toYear(d.month);
    if (!bucketBy[label]) {
      bucketBy[label] = { label, revenue: 0, net_profit: 0, gross_profit: 0, expenses: 0 };
    }
    bucketBy[label].revenue += d.revenue ?? 0;
    bucketBy[label].net_profit += d.net_profit ?? 0;
    bucketBy[label].gross_profit += d.gross_profit ?? 0;
    bucketBy[label].expenses += d.expenses ?? 0;
  }
  return Object.values(bucketBy).sort((a, b) => labelComparator(freq)(a.label, b.label));
}

function projectionSeriesForKey(projectionsData, timeframeKey) {
  if (!projectionsData || !projectionsData[timeframeKey]) return { freq: "monthly", rows: [] };
  const rows = projectionsData[timeframeKey].map((d) => {
    if (d.month) return { label: d.month, ...d };
    if (d.quarter) return { label: d.quarter, ...d };
    return { label: String(d.year), ...d };
  }).map((d) => ({
    label: d.label,
    revenue: d.revenue ?? null,
    net_profit: d.net_profit ?? null,
    gross_profit: d.gross_profit ?? null,
    expenses: d.expenses ?? null,
  }));
  const first = projectionsData[timeframeKey][0] || {};
  const freq = first.month ? "monthly" : first.quarter ? "quarterly" : "annual";
  rows.sort((a, b) => labelComparator(freq)(a.label, b.label));
  return { freq, rows };
}

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

/** ===================== Fancy Brand Mark ===================== **/
function BrandMark() {
  const theme = useTheme();
  const pulse = keyframes`
    from { transform: scale(1); }
    50% { transform: scale(1.06); }
    to { transform: scale(1); }
  `;
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        mr: 1.5,
        borderRadius: 2.5,
        position: "relative",
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main,0.35)}, ${alpha('#1b2030',0.95)})`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        '&:hover .glow': { opacity: 0.7 }
      }}
    >
      <Box className="glow" sx={{
        position: 'absolute', inset: 0, opacity: 0.45, transition: 'opacity .4s',
        background: `radial-gradient(120px 80px at 70% 20%, ${alpha(theme.palette.secondary.main, .35)}, transparent 55%)`
      }}/>
      {/* Simple line/area emblem */}
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
        <polyline
          points="8,72 32,50 50,58 72,30 92,40"
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth="8"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 3px 6px rgba(122,162,247,0.45))' }}
        />
        <circle cx="72" cy="30" r="6" fill={theme.palette.secondary.main} style={{ animation: `${pulse} 3s ease-in-out infinite` }}/>
      </svg>
    </Box>
  );
}

/** ===================== Custom MUI Tooltip for Recharts ===================== **/
function MuiChartTooltip({ active, payload, label }) {
  const theme = useTheme();
  if (!active || !payload || payload.length === 0) return null;

  // payload contains series in draw order; we group by metric + suffix
  const row = payload.reduce((acc, p) => {
    const key = p.dataKey; // e.g. 'revenue_hist' or 'revenue_proj'
    acc[key] = p.value;
    return acc;
  }, {});

  const metricRows = METRICS.map((m) => {
    const oldVal = row[`${m.key}_hist`];
    const projVal = row[`${m.key}_proj`];
    if (oldVal == null && projVal == null) return null;
    return { key: m.key, label: m.label, color: COLOR_BY_METRIC[m.key], oldVal, projVal };
  }).filter(Boolean);

  return (
    <Paper
      elevation={6}
      sx={{
        p: 1.25,
        minWidth: 280,
        borderRadius: 3,
        bgcolor: 'transparent',
        background: `linear-gradient(180deg, ${alpha('#0f1420',0.96)}, ${alpha('#0b0e14',0.96)})`,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 14px 38px rgba(0,0,0,0.55)',
        backdropFilter: 'saturate(1.1) blur(8px)'
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ letterSpacing: 0.3 }}>
            Period: {label}
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label="Hover"
            sx={{ borderColor: alpha('#fff',0.15), color: 'text.secondary' }}
          />
        </Stack>

        <Divider />

        <Grid container spacing={1} columns={12} sx={{ pt: 0.5 }}>
          {metricRows.map((m) => (
            <Grid key={m.key} item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{
                  width: 8, height: 8, borderRadius: 0.75,
                  bgcolor: m.color, boxShadow: `0 0 0 3px ${alpha(m.color,0.15)}`
                }}/>
                <Typography variant="body2" sx={{ fontWeight: 700, color: m.color, minWidth: 120 }}>
                  {m.label}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Stack direction="row" spacing={1.5} alignItems="baseline">
                  {m.oldVal != null && (
                    <Chip
                      size="small"
                      label={`Old: ${prettyNumber(m.oldVal)}`}
                      sx={{ bgcolor: alpha(m.color, 0.1), color: alpha('#fff',0.9), borderColor: alpha(m.color,0.25) }}
                      variant="outlined"
                    />
                  )}
                  {m.projVal != null && (
                    <Chip
                      size="small"
                      label={`Proj: ${prettyNumber(m.projVal)}`}
                      sx={{
                        bgcolor: alpha(m.color, 0.08),
                        color: alpha('#fff',0.9),
                        borderColor: alpha(m.color,0.35)
                      }}
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
}

/** ===================== Help Dialog ===================== **/
function HelpDialog({ open, onClose, onStartTour }) {
  const [tab, setTab] = useState(0);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>How to use Projections Visualizer</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="Steps" />
          <Tab label="Data formats" />
          <Tab label="Tips" />
        </Tabs>
        {tab === 0 && (
          <Stack spacing={2}>
            <Typography>
              Upload your historical monthly dataset and the projections generated by your engine. The app will aggregate and compare metrics across months, quarters, or years with interactive charts.
            </Typography>
            <Alert severity="info" variant="outlined">
              You can switch between Old, Projections, or Both, and toggle specific metrics to declutter the visualization.
            </Alert>
          </Stack>
        )}
        {tab === 1 && (
          <Stack spacing={1.25}>
            <Typography variant="subtitle2">Quick steps</Typography>
            <ol style={{ marginTop: 0 }}>
              <li>Upload <code>data.json</code> containing <code>{`{ old_data: [...] }`}</code>.</li>
              <li>Upload <code>projections.json</code> containing <code>{`{ projections_data: { ... } }`}</code>.</li>
              <li>Choose a timeframe (monthly, quarterly, annual views).</li>
              <li>Use Show toggle to view Old, Projections, or Both.</li>
              <li>Toggle metrics to focus the chart.</li>
            </ol>
          </Stack>
        )}
        {tab === 2 && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Historical data example (<code>data.json</code>)</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "old_data": [
    { "month": "2023-01", "revenue": 120000, "net_profit": 18000, "gross_profit": 54000, "expenses": 102000 },
    { "month": "2023-02", "revenue": 130000, "net_profit": 20000, "gross_profit": 57000, "expenses": 110000 }
  ]
}`}</pre>
            </Paper>
            <Typography variant="subtitle2">Projections example (<code>projections.json</code>)</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "projections_data": {
    "one_year_monthly": [
      { "month": "2024-01", "revenue": 140000, "net_profit": 22000, "gross_profit": 60000, "expenses": 118000 }
    ],
    "five_years_quarterly": [
      { "quarter": "2024-Q1", "revenue": 420000, "net_profit": 66000, "gross_profit": 180000, "expenses": 354000 }
    ],
    "ten_years_annual": [
      { "year": 2024, "revenue": 1680000, "net_profit": 264000, "gross_profit": 720000, "expenses": 1416000 }
    ]
  }
}`}</pre>
            </Paper>
            <Typography variant="body2" color="text.secondary">
              Monthly historical data will be aggregated automatically when you switch to quarterly or annual views.
            </Typography>
          </Stack>
        )}
        {tab === 3 && (
          <Stack spacing={1.25}>
            <Typography variant="subtitle2">Tips</Typography>
            <ul style={{ marginTop: 0 }}>
              <li>Hover the chart to see a detailed tooltip with Old vs Proj per metric.</li>
              <li>Use the legend and metric toggles to reduce noise.</li>
              <li>Keyboard: press <kbd>?</kbd> to open this help.</li>
            </ul>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onStartTour} variant="contained">Start guided tour</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

/** ===================== App ===================== **/
export default function App() {
  const theme = useTheme();
  const [oldDataFile, setOldDataFile] = useState(null);
  const [projDataFile, setProjDataFile] = useState(null);
  const [oldData, setOldData] = useState(null);
  const [projections, setProjections] = useState(null);

  const [timeframe, setTimeframe] = useState("one_year_monthly");
  theme.palette.mode // referencing theme to avoid unused warning
  const [datasetMode, setDatasetMode] = useState("both");
  const [selected, setSelected] = useState({
    revenue: true, net_profit: true, gross_profit: true, expenses: true,
  });

  const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourRun, setTourRun] = useState(false);
  const tourRef = useRef(null);

  async function readJSONFile(file, onData, expectation) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      onData(json);
    } catch {
      setSnack({ open: true, msg: `Invalid ${expectation} JSON.`, sev: "error" });
    }
  }

  function loadOldFile(file) {
    if (!file) return;
    setOldDataFile(file);
    readJSONFile(file, (json) => {
      if (!json || !Array.isArray(json.old_data)) {
        setSnack({ open: true, msg: "data.json must contain { old_data: [...] }", sev: "warning" });
        return;
      }
      setOldData(json.old_data);
      setSnack({ open: true, msg: `Loaded ${file.name}`, sev: "success" });
    }, "data.json");
  }
  function loadProjFile(file) {
    if (!file) return;
    setProjDataFile(file);
    readJSONFile(file, (json) => {
      if (!json || !json.projections_data) {
        setSnack({ open: true, msg: "projections.json must contain { projections_data: { ... } }", sev: "warning" });
        return;
      }
      setProjections(json.projections_data);
      setSnack({ open: true, msg: `Loaded ${file.name}`, sev: "success" });
    }, "projections.json");
  }
  function onUploadOld(e) {
    const file = e.target.files?.[0];
    loadOldFile(file);
  }
  function onUploadProjections(e) {
    const file = e.target.files?.[0];
    loadProjFile(file);
  }

  useEffect(() => {
    const seen = localStorage.getItem("pv_seen_help");
    if (!seen) {
      setHelpOpen(true);
      localStorage.setItem("pv_seen_help", "1");
    }
    const onKey = (e) => {
      if (e.key === "?") setHelpOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { freq, histRows, projRows, rows } = useMemo(() => {
    const tf = TIMEFRAMES.find((t) => t.key === timeframe) || TIMEFRAMES[0];
    const hist = oldData ? aggregateOldData(oldData, tf.freq) : [];
    const projPack = projections ? projectionSeriesForKey(projections, timeframe) : { rows: [], freq: tf.freq };
    const merged = buildChartRows(hist, projPack.rows, tf.freq, datasetMode);
    return { freq: tf.freq, histRows: hist, projRows: projPack.rows, rows: merged };
  }, [oldData, projections, timeframe, datasetMode]);

  const filesReady = !!oldData && !!projections;

  const tourSteps = useMemo(() => ([
    { element: "[data-tour='upload-old']", popover: { title: "Upload historical data", description: "Start by uploading your monthly data.json with old_data." } },
    { element: "[data-tour='upload-proj']", popover: { title: "Upload projections", description: "Upload projections.json produced by your engine." } },
    { element: "[data-tour='timeframe']", popover: { title: "Pick a timeframe", description: "View monthly, quarterly, or annual aggregation." } },
    { element: "[data-tour='show-toggle']", popover: { title: "Select dataset", description: "Switch between Old, Projections, or Both." } },
    { element: "[data-tour='metrics']", popover: { title: "Toggle metrics", description: "Show or hide metrics to focus your analysis." } },
    { element: "[data-tour='chart']", popover: { title: "Interact with the chart", description: "Hover for tooltips. Colors match across Old (solid) and Proj (dashed)." } }
  ]), []);

  useEffect(() => {
    if (!tourRun) return;
    // Prevent re-init if already running
    if (tourRef.current) {
      try { tourRef.current.destroy(); } catch {}
      tourRef.current = null;
    }
    const d = driver({
      steps: tourSteps,
      showProgress: true,
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      allowClose: true,
      onDestroyed: () => { tourRef.current = null; },
      onCloseClick: () => { tourRef.current = null; }
    });
    tourRef.current = d;
    d.drive();
    // Immediately reset flag so re-renders won't retrigger
    setTourRun(false);
    // Cleanup on unmount
    return () => {
      if (tourRef.current) {
        try { tourRef.current.destroy(); } catch {}
        tourRef.current = null;
      }
    };
  }, [tourRun, tourSteps]);

  return (
    <>
      {/* Branded App Bar */}
      <AppBar
        position="sticky"
        color="transparent"
        enableColorOnDark
        sx={{
          backdropFilter: 'blur(8px)',
          background: `linear-gradient(180deg, ${alpha('#0b0e14',0.92)} 0%, ${alpha('#0b0e14',0.6)} 60%, transparent 100%)`,
          borderBottom: theme => `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ minHeight: 70 }}>
          <BrandMark />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1, letterSpacing: 0.4 }}>
              Projections Visualizer
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Compare historical performance with multi-horizon projections
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="All charts are interactive. Hover for details.">
              <IconButton size="large" color="inherit">
                <InsightsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Help and guided tour (or press ?)">
              <IconButton size="large" color="inherit" onClick={() => setHelpOpen(true)}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        {/* Hero Header */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, background: (t) => `linear-gradient(180deg, ${alpha('#0f1420',0.7)}, ${alpha('#0b0e14',0.7)})` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(theme.palette.primary.main, 0.12), border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}` }}>
                  <RocketLaunchIcon color="primary" />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>Analytics Dashboard</Typography>
                  <Typography variant="body2" color="text.secondary">Upload, compare, and communicate outcomes across timelines with confidence.</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} spacing={1}>
                <Button startIcon={<HelpOutlineIcon />} variant="outlined" onClick={() => setHelpOpen(true)}>Help</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[{ key: 'hist', label: 'Historical points', value: histRows.length, icon: <TimelineIcon /> }, { key: 'proj', label: 'Projection points', value: projRows.length, icon: <TimelineIcon /> }, { key: 'metrics', label: 'Visible metrics', value: Object.values(selected).filter(Boolean).length, icon: <TuneIcon /> }].map((kpi) => (
            <Grid item xs={12} sm={4} key={kpi.key}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.12), border: `1px solid ${alpha(theme.palette.primary.main, 0.24)}` }}>
                    {kpi.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="overline" color="text.secondary">{kpi.label}</Typography>
                    <Typography variant="h6">{kpi.value}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
        {/* Uploads */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6} data-tour="upload-old">
              <Stack spacing={1.25}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadOldFile(f); }}
              >
                <Typography variant="subtitle1">Upload <code>data.json</code> (historical)</Typography>
                <Stack direction="row" spacing={1}>
                  <Button component="label" variant="contained" startIcon={<UploadFileIcon />}>
                    Choose file
                    <input type="file" hidden accept=".json,application/json" onChange={onUploadOld} />
                  </Button>
                  {oldDataFile && (
                    <>
                      <Chip icon={<CheckCircleOutlineIcon />} label={oldDataFile.name} color="success" variant="outlined" />
                      <Tooltip title="Remove file">
                        <IconButton onClick={() => { setOldDataFile(null); setOldData(null); }}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">Drag & drop <code>data.json</code> here</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6} data-tour="upload-proj">
              <Stack spacing={1.25}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadProjFile(f); }}
              >
                <Typography variant="subtitle1">Upload <code>projections.json</code> (engine output)</Typography>
                <Stack direction="row" spacing={1}>
                  <Button component="label" variant="contained" color="secondary" startIcon={<UploadFileIcon />}>
                    Choose file
                    <input type="file" hidden accept=".json,application/json" onChange={onUploadProjections} />
                  </Button>
                  {projDataFile && (
                    <>
                      <Chip icon={<CheckCircleOutlineIcon />} label={projDataFile.name} color="secondary" variant="outlined" />
                      <Tooltip title="Remove file">
                        <IconButton onClick={() => { setProjDataFile(null); setProjections(null); }}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">Drag & drop <code>projections.json</code> here</Typography>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info" variant="outlined">
                Historical monthly data is automatically aggregated to quarterly / annual when you choose those timeframes.
              </Alert>
            </Grid>
          </Grid>
        </Paper>

        {/* Controls */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4} data-tour="timeframe">
              <FormControl fullWidth disabled={!filesReady}>
                <InputLabel id="tf-label">Timeframe</InputLabel>
                <Select labelId="tf-label" label="Timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                  {TIMEFRAMES.map((t) => (<MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4} data-tour="show-toggle">
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>Show</Typography>
                <ToggleButtonGroup
                  value={datasetMode}
                  exclusive
                  onChange={(_, v) => v && setDatasetMode(v)}
                  fullWidth
                  color="primary"
                  disabled={!filesReady}
                >
                  <ToggleButton value="old">Old only</ToggleButton>
                  <ToggleButton value="proj">Projections only</ToggleButton>
                  <ToggleButton value="both">Both</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4} data-tour="metrics">
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>Metrics</Typography>
                <FormGroup row>
                  {METRICS.map((m) => (
                    <FormControlLabel
                      key={m.key}
                      control={
                        <Checkbox
                          checked={!!selected[m.key]}
                          onChange={(e) => setSelected((s) => ({ ...s, [m.key]: e.target.checked }))}
                          sx={{
                            color: COLOR_BY_METRIC[m.key],
                            '&.Mui-checked': { color: COLOR_BY_METRIC[m.key] }
                          }}
                          disabled={!filesReady}
                        />
                      }
                      label={
                        <Chip
                          label={m.label}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: alpha(COLOR_BY_METRIC[m.key], 0.5),
                            color: COLOR_BY_METRIC[m.key],
                            fontWeight: 700
                          }}
                        />
                      }
                    />
                  ))}
                </FormGroup>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Chart */}
        <Paper sx={{ p: 2 }} data-tour="chart">
          {!filesReady ? (
            <Stack spacing={2} sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="h6">Get started</Typography>
              <Typography variant="body2">Upload both <code>data.json</code> and <code>projections.json</code> to render the chart.</Typography>
              <Stack direction="row" justifyContent="center" spacing={1}>
                <Button variant="contained" onClick={() => setHelpOpen(true)}>View help</Button>
                <Button variant="outlined" onClick={() => setTourRun(true)}>Start guided tour</Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ color: "text.secondary", px: 0.5, pb: 1 }}>
                <Typography variant="body2">
                  <b>X-axis:</b> {freq === "monthly" ? "Month" : freq === "quarterly" ? "Quarter" : "Year"}
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption">{histRows.length} historical points</Typography>
                  <Typography variant="caption">{projRows.length} projection points</Typography>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 460 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows} margin={{ top: 10, right: 24, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(n) => prettyNumber(n)} width={90} />
                    <RTooltip content={<MuiChartTooltip />} />
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
                        isAnimationActive
                        animationDuration={650}
                        animationEasing="ease-in-out"
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
                        isAnimationActive
                        animationDuration={850}
                        animationBegin={120}
                        animationEasing="ease-in-out"
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </>
          )}
        </Paper>

        <Stack direction="row" justifyContent="center" sx={{ color: "text.secondary", mt: 2 }}>
          <Typography variant="caption">Built with React, Material UI, and Recharts.</Typography>
        </Stack>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>

      <HelpDialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onStartTour={() => { setHelpOpen(false); setTourRun(true); }}
      />
    </>
  );
}
