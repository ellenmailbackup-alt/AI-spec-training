import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => CURRENT_YEAR - i);

async function downloadExcel(
  url: string,
  filename: string,
  setLoading: (v: boolean) => void
) {
  setLoading(true);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Download failed" }));
      throw new Error(err.error || "Download failed");
    }
    const blob = await res.blob();
    const href = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(href);
    document.body.removeChild(a);
  } finally {
    setLoading(false);
  }
}

export default function AccountingReports() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loadingBoeren, setLoadingBoeren] = useState(false);
  const [loadingB2C, setLoadingB2C] = useState(false);
  const [loadingCash, setLoadingCash] = useState(false);

  // Kasboek beginning balance state
  const [kasBalance, setKasBalance] = useState<string>("");
  const [kasBalanceSaving, setKasBalanceSaving] = useState(false);
  const [kasBalanceSaved, setKasBalanceSaved] = useState(false);

  // Fetch beginning balance whenever the year changes
  useEffect(() => {
    setKasBalanceSaved(false);
    fetch(`/api/accounting/kas-beginsaldo?year=${year}`)
      .then((r) => r.json())
      .then((data) => setKasBalance(String(data.value ?? 0)))
      .catch(() => setKasBalance("0"));
  }, [year]);

  const saveKasBalance = async () => {
    const num = parseFloat(kasBalance);
    if (isNaN(num)) return;
    setKasBalanceSaving(true);
    try {
      await fetch("/api/accounting/kas-beginsaldo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, value: num }),
      });
      setKasBalanceSaved(true);
    } finally {
      setKasBalanceSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Accounting Reports</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        {/* Year selector */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="form-group">
              <label htmlFor="year-select" className="font-weight-bold">Select Year</label>
              <select
                id="year-select"
                className="form-control"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kasboek configuration */}
        <div className="row mb-4">
          <div className="col-md-5">
            <div className="card card-outline card-secondary">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-cog mr-2"></i>
                  Kasboek Configuration
                </h3>
              </div>
              <div className="card-body">
                <div className="form-group mb-0">
                  <label className="font-weight-bold">
                    Starting cash balance {year} (Beginsaldo)
                  </label>
                  <div className="input-group">
                    <div className="input-group-prepend">
                      <span className="input-group-text">€</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={kasBalance}
                      onChange={(e) => { setKasBalance(e.target.value); setKasBalanceSaved(false); }}
                    />
                    <div className="input-group-append">
                      <button
                        className="btn btn-primary"
                        disabled={kasBalanceSaving}
                        onClick={saveKasBalance}
                      >
                        {kasBalanceSaving ? (
                          <><i className="fas fa-spinner fa-spin mr-1"></i>Saving…</>
                        ) : kasBalanceSaved ? (
                          <><i className="fas fa-check mr-1"></i>Saved</>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  </div>
                  <small className="text-muted">
                    Used as the opening balance in the Kasboek report for {year}.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Report 1: Boeren en Buren */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-tractor mr-2"></i>
                  Boeren en Buren
                </h3>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Daily aggregated sales totals per buurderij customer for {year}.
                  Split into Q1–Q4 tabs with daily subtotals and VAT breakdown.
                </p>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-success"
                  disabled={loadingBoeren}
                  onClick={() =>
                    downloadExcel(
                      `/api/accounting/reports/boeren-buren?year=${year}`,
                      `BoerenBuren_${year}.xlsx`,
                      setLoadingBoeren
                    )
                  }
                >
                  {loadingBoeren ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-excel mr-2"></i>
                      Download Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report 2: B2C Sales */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-shopping-basket mr-2"></i>
                  B2C Sales
                </h3>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  All B2C sales for {year} grouped by payment method. Split into
                  Q1–Q4 tabs with daily subtotals and VAT breakdown.
                </p>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-success"
                  disabled={loadingB2C}
                  onClick={() =>
                    downloadExcel(
                      `/api/accounting/reports/b2c-sales?year=${year}`,
                      `B2C_Sales_${year}.xlsx`,
                      setLoadingB2C
                    )
                  }
                >
                  {loadingB2C ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-excel mr-2"></i>
                      Download Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report 3: Kasboek */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-cash-register mr-2"></i>
                  Kasboek
                </h3>
              </div>
              <div className="card-body">
                <p className="text-muted">
                  Cash ledger for {year} with running balance per quarter (Q1–Q4).
                  Starts from the configured Beginsaldo above.
                </p>
              </div>
              <div className="card-footer">
                <button
                  className="btn btn-success"
                  disabled={loadingCash}
                  onClick={() =>
                    downloadExcel(
                      `/api/accounting/reports/cash-payments?year=${year}`,
                      `Kasboek_${year}.xlsx`,
                      setLoadingCash
                    )
                  }
                >
                  {loadingCash ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Generating…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-excel mr-2"></i>
                      Download Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
