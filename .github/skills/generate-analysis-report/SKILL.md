---
name: generate-analysis-report
description: Compile bug fix proposals and validation results into a markdown report. Use this after running bug-analyzer and fix-validator on multiple PRs.
---

# Generate Analysis Report Skill

This skill compiles all analysis results into a summary markdown report.

## Usage

Run the `report.sh` script:

```bash
./report.sh [--input-dir <path>] [--output <file>]
```

### Parameters

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| `--input-dir` | No | Directory containing analysis folders | `data/analysis` |
| `--output` | No | Output file path | `data/analysis-results.md` |

### Example

```bash
# Generate report from all analyses
./.github/skills/generate-analysis-report/report.sh

# Custom paths
./.github/skills/generate-analysis-report/report.sh \
  --input-dir ./my-analyses \
  --output ./report.md
```

## Expected Input Structure

The script expects the following structure:

```
data/analysis/
├── 12345/                    # PR number
│   ├── metadata.json         # Required
│   ├── issue.md             
│   ├── pr.md                
│   ├── proposal.md           # Bug-analyzer output (optional)
│   └── validation.md         # Fix-validator output (optional)
├── 12346/
│   └── ...
```

## Output Format

The report includes:

1. **Summary Statistics**
   - Total PRs analyzed
   - Average alignment score
   - Score distribution

2. **Results Table**
   | PR # | Issue # | Proposed Fix Summary | Alignment Score | Key Findings |

3. **Detailed Breakdown** (optional)
   - Each PR's full analysis

## Prerequisites

- `jq` for JSON processing
- Analysis directories with `metadata.json`
