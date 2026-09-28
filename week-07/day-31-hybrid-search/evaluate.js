// Scores a retrieval function on the test queries. Used by Days 31, 32 and 35.
import { testQueries } from "./test-queries.js";

// hit@1: the right lesson is the first result. hit@3: it's in the first 3 lessons.
// MRR (mean reciprocal rank): 1 if it's first, 1/2 if second, 1/3 if third... averaged.
export async function evaluate(retrieveFn) {
  const rows = [];
  for (const { type, query, expect } of testQueries) {
    const results = await retrieveFn(query);
    const lessons = [...new Set(results.map((r) => r.source.split("/")[1]))]; // distinct lesson folders, in order
    const rank = lessons.findIndex((lesson) => expect.some((e) => lesson?.startsWith(e))) + 1; // 0 = not found
    rows.push({ type, query, rank });
  }
  const summarize = (subset) => ({
    hit1: subset.filter((r) => r.rank === 1).length,
    hit3: subset.filter((r) => r.rank >= 1 && r.rank <= 3).length,
    mrr: subset.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) / subset.length,
    total: subset.length,
  });
  return {
    rows,
    all: summarize(rows),
    exact: summarize(rows.filter((r) => r.type === "exact")),
    meaning: summarize(rows.filter((r) => r.type === "meaning")),
  };
}

export function printSummary(name, result) {
  const fmt = ({ hit1, hit3, mrr, total }) => `hit@1 ${hit1}/${total}  hit@3 ${hit3}/${total}  MRR ${mrr.toFixed(2)}`;
  console.log(`\n${name}`);
  console.log(`  all      ${fmt(result.all)}`);
  console.log(`  exact    ${fmt(result.exact)}`);
  console.log(`  meaning  ${fmt(result.meaning)}`);
}
