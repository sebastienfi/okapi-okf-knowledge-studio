# Convention

* [Analysis window](analysis-window.md) - The since/until windowing semantics every metric shares (null = all history).

# Insight Layer

* [Insights](insights.md) - Server-side interpretation: ranked, typed insights with thresholds and suggested actions.

# Metric

* [Branch drift](branch-drift.md) - Ahead/behind-the-default counts per branch, denormalized at ingest.
* [Bus factor](bus-factor.md) - Knowledge-concentration signals at file and repository level.
* [Code coupling](code-coupling.md) - File pairs that change together, scored with a windowed, filtered Jaccard.
* [Collaboration](collaboration.md) - Author pairs who touched the same files.
* [Commit activity](commit-activity.md) - Commit/churn time series in UTC-normalized day/week/month buckets.
* [Directory ownership](directory-ownership.md) - Per-directory activity and author dominance; feeds the ownership treemap.
* [File hotspots](file-hotspots.md) - Top files by change frequency or churn, with bus-factor signals per file.
* [Top contributors](top-contributors.md) - Ranked contributor leaderboard with commit share and first/last activity.
