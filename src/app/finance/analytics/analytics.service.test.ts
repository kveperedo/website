import { afterEach, describe, expect, it, vi } from "vitest";

import { getFinanceDashboard } from "./analytics.service.server";

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock("@/app/infra/database/client.server", () => ({
  getDb: getDbMock,
}));

const mockQueryRaw = (calls: Array<Array<unknown>>) => {
  const queryRaw = vi.fn();
  for (const rows of calls) {
    queryRaw.mockResolvedValueOnce(rows);
  }
  vi.mocked(getDbMock).mockReturnValue({ $queryRaw: queryRaw } as never);
  return queryRaw;
};

// 2026-11-09T03:00:00Z is 2026-11-09 in Asia/Manila.
const NOW = new Date("2026-11-09T03:00:00.000Z");
// Six months back from 2026-11 is 2026-06-01 00:00 +08.
const MANILA_SIX_MONTHS_BACK = new Date("2026-05-31T16:00:00.000Z");
// The end of today is 2026-11-10 00:00 +08.
const MANILA_END_OF_TODAY = new Date("2026-11-09T16:00:00.000Z");

const dailyTotals = [
  { day: "2026-11-01", type: "income", total: 1000, count: 1 },
  { day: "2026-11-01", type: "expense", total: 500, count: 1 },
  // Prior month appears in both the partial (history) range and the full (net) range.
  { day: "2026-10-05", type: "expense", total: 400, count: 1 },
  // After the 9th: excluded from history's partial October range, included in net's full month.
  { day: "2026-10-20", type: "expense", total: 999, count: 1 },
];

const categoryRows = [
  { month: "2026-10", category: "food_drinks" as const, total: 500 },
  { month: "2026-11", category: "groceries_household" as const, total: 300 },
  { month: "2026-11", category: "food_drinks" as const, total: 200 },
];

describe("getFinanceDashboard", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("derives history, net, trends and summary from two queries", async () => {
    const queryRaw = mockQueryRaw([dailyTotals, categoryRows]);

    const dashboard = await getFinanceDashboard(NOW);

    expect(queryRaw).toHaveBeenCalledTimes(2);
    // Both queries reach six months back and stop at the end of today, so the
    // category cards stay month-to-date like the summary card.
    expect(queryRaw.mock.calls.map((call) => call.slice(1))).toEqual([
      ["Asia/Manila", MANILA_SIX_MONTHS_BACK, MANILA_END_OF_TODAY],
      ["Asia/Manila", MANILA_SIX_MONTHS_BACK, MANILA_END_OF_TODAY],
    ]);

    expect(dashboard.history.current).toMatchObject({
      income: 1000,
      expenses: 500,
      transactionCount: 2,
    });
    // Partial October (to the 9th) excludes the 20th.
    expect(dashboard.history.prior[0]).toMatchObject({ expenses: 400, transactionCount: 1 });
    // Full October in monthly net includes the 20th.
    const october = dashboard.monthlyNet.find((entry) => entry.month === "2026-10");
    expect(october).toMatchObject({ expenses: 1399, transactionCount: 2 });
    expect(dashboard.categorySummary).toEqual([
      { category: "groceries_household", total: 300 },
      { category: "food_drinks", total: 200 },
    ]);
    expect(dashboard.categoryTrends).toHaveLength(2);
    expect(dashboard.categoryTrends[1]).toMatchObject({
      month: "2026-11",
      groceries_household: 300,
      food_drinks: 200,
    });
  });

  it("returns empty monthly net when there are no transactions", async () => {
    mockQueryRaw([[], []]);

    const dashboard = await getFinanceDashboard(NOW);

    expect(dashboard.monthlyNet).toEqual([]);
    expect(dashboard.categorySummary).toEqual([]);
    expect(dashboard.categoryTrends).toEqual([]);
    expect(dashboard.history.current.transactionCount).toBe(0);
  });
});
