// Node emits both per-file and final summaries. Keeping the structured counts
// lets the harness reject empty files and skipped suites without parsing prose.
export default async function* summaryReporter(events) {
  for await (const event of events) if (event.type === 'test:summary') yield JSON.stringify(event.data) + '\n';
}
