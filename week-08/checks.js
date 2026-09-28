// Code-based checks: fast, free and never flaky. Use them wherever a rule can be written in code.
// Each check returns null when it passes, or a short reason when it fails.

const SAYS_DONT_KNOW = /(don't|do not|doesn't|does not|can't|cannot) (know|find|contain|include|mention|cover|say|provide|have)|not (mentioned|covered|included|in the documents|stated)|no information|थाहा छैन/i;

export const saysDontKnow = (answer) => SAYS_DONT_KNOW.test(answer);

// Does the answer mention every required fact? ["a", ["b", "c"]] means: "a" AND ("b" OR "c")
export function missingFacts(answer, mustMention = []) {
  const lower = answer.toLowerCase();
  return mustMention
    .map((fact) => [fact].flat())
    .filter((options) => !options.some((o) => lower.includes(o.toLowerCase())))
    .map((options) => options.join(" / "));
}

// Did any citation come from one of the lessons that really answer the question?
export const citesExpectedSource = (citations, sources) =>
  citations.some((c) => sources.some((s) => c.source.includes(`/${s}`)));

// Run every check that applies to this item. Returns a list of failure reasons (empty = pass).
export function codeChecks(item, result) {
  const failures = [];
  if (item.type === "unanswerable") {
    if (!saysDontKnow(result.answer)) failures.push("should say it doesn't know");
    return failures;
  }
  if (saysDontKnow(result.answer)) failures.push("said it doesn't know");
  const missing = missingFacts(result.answer, item.mustMention);
  if (missing.length) failures.push(`missing: ${missing.join(", ")}`);
  if (result.citations.length === 0) failures.push("no citations");
  else if (!citesExpectedSource(result.citations, item.sources)) failures.push(`didn't cite ${item.sources.join(" or ")}`);
  return failures;
}
