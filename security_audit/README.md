# Security audit reports

Six external audit rounds, oldest first. Per-finding status and the round that fixed each one are in the `Fixed In` column of [`security-audit-findings.csv`](security-audit-findings.csv).

| Round | Report                                                                  |
| ----- | ----------------------------------------------------------------------- |
| v1    | [`security-audit-report.pdf`](security-audit-report.pdf)                |
| v2    | [`security-audit-report-v2.pdf`](security-audit-report-v2.pdf)          |
| v3    | [`security-audit-report-v3.pdf`](security-audit-report-v3.pdf)          |
| v4    | [`security-audit-report-v4.pdf`](security-audit-report-v4.pdf)          |
| v5    | [`security-audit-report-v5.pdf`](security-audit-report-v5.pdf)          |
| v6    | [`security-audit-report-v6.pdf`](security-audit-report-v6.pdf) (latest) |

## Mapping to the rules

[`docs/SECURITY.md`](../docs/SECURITY.md) turns the findings into rules. Each rule cites the finding ID that produced it (for example C-1, H-3, N-2, M-6, R-2, S-1); look the ID up in the CSV for severity, OWASP category and affected file. The "Security Model" section of [`CLAUDE.md`](../CLAUDE.md) is the short version of the same rules.
