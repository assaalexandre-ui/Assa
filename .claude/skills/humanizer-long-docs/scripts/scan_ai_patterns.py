#!/usr/bin/env python3
"""
scan_ai_patterns.py — deterministic reconnaissance pass for the humanizer skill.

Scans a text file for the AI-tell words and phrases catalogued in
references/patterns.md and prints a categorized hit-count report: which
patterns showed up, how many times, and on which lines.

This is a triage tool, not a rewriter. A hit doesn't automatically mean the
word is wrong in context ("highlight" as a literal verb is fine; "highlighting
its enduring significance" is the tell) — use this to know where to look
closely, not as a find-and-replace list.

Usage:
    python scan_ai_patterns.py <path-to-text-file>
    python scan_ai_patterns.py <path-to-text-file> --json   # machine-readable output
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Each entry: category -> list of (label, regex pattern, case-insensitive?)
# Patterns are intentionally phrase-level where possible to reduce false
# positives on legitimate literal usage (e.g. "a testament" as a legal document).
PATTERN_GROUPS = {
    "AI vocabulary": [
        "additionally", "furthermore", "moreover", r"\bdelve\b", r"\bleverage\b",
        r"\bharness(?:ing|es)?\b", "unlock the power", r"\bseamless(?:ly)?\b",
        r"\bcrucial\b", r"\bfoster(?:ing|s)?\b", r"\bgarner(?:ing|s|ed)?\b",
        r"\binterplay\b", r"\bintricat(?:e|ely|acies)\b", r"\bpivotal\b",
        r"\btapestry\b", r"\btestament\b", r"\bunderscor(?:e|es|ed|ing)\b",
        r"\bvibrant\b", "in today's world", "rapidly evolving", "evolving landscape",
    ],
    "Significance inflation": [
        "marks a pivotal", "stands as a testament", "serves as a reminder",
        "plays a (?:vital|significant|crucial|key) role", "sets the stage for",
        "an? (?:indelible|lasting) mark", "deeply rooted",
    ],
    "Copula avoidance": [
        r"\bserves? as\b", r"\bstands? as\b", r"\bboasts?\b", r"\bfeatures?\b(?=.{0,15}(?:including|such as))",
    ],
    "Superficial -ing analysis": [
        r"\bhighlighting\b", r"\bunderscoring\b", r"\bemphasizing\b",
        r"\breflecting\b", r"\bsymbolizing\b", r"\bshowcasing\b",
        r"\bcultivating\b", r"\bencompassing\b",
    ],
    "Vague attribution": [
        "industry reports", "observers have (?:cited|noted)", "experts (?:argue|believe)",
        "some critics argue", "many believe",
    ],
    "Formulaic challenges section": [
        "despite (?:its|these) challenges", "faces (?:several|numerous) challenges",
        "future outlook", "challenges and (?:legacy|future)",
    ],
    "Negative parallelism": [
        "it'?s not just", "not only .{0,40} but",
    ],
    "Rule of three / false range": [
        r"from .{3,40} to .{3,40}, from .{3,40} to",
    ],
    "Chatbot artifacts": [
        "i hope this helps", r"\bcertainly!", r"\bof course!",
        "let me know if", "great question", "you'?re absolutely right",
    ],
    "Knowledge-cutoff disclaimer": [
        "as of my (?:last|knowledge)", "up to my last training update",
        "while specific details are limited", "based on available information",
    ],
    "Excessive hedging": [
        "could potentially possibly", "might possibly", "it could be argued that it may",
    ],
    "Generic positive conclusion": [
        "the future looks bright", "exciting times (?:lie|ahead)", "journey toward excellence",
    ],
    "Filler phrases": [
        "in order to", "due to the fact that", "at this point in time",
        "in the event that", "it is important to note",
    ],
    "Formatting tells": [
        "\u2014",  # em dash
        "\u201c", "\u201d",  # curly double quotes
        "\u2018", "\u2019",  # curly single quotes / smart apostrophe
        "\u2026",  # ellipsis glyph (vs three periods)
        r"[\U0001F300-\U0001FAFF\u2600-\u27BF\u2190-\u21FF\u2B00-\u2BFF]",  # emoji / dingbat ranges
    ],
}


def scan_file(path: Path):
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()

    results = {}
    for category, patterns in PATTERN_GROUPS.items():
        hits = []
        for pat in patterns:
            try:
                regex = re.compile(pat, re.IGNORECASE)
            except re.error:
                continue
            for line_no, line in enumerate(lines, start=1):
                for _ in regex.finditer(line):
                    hits.append({"pattern": pat, "line": line_no, "context": line.strip()[:100]})
        if hits:
            results[category] = hits
    return results


def print_report(results, path):
    total = sum(len(v) for v in results.values())
    print(f"AI-pattern scan: {path}")
    print(f"Total hits: {total}\n")
    if not results:
        print("No matches from the pattern list. Still worth a manual pass for "
              "rhythm, personality, and register fit — this scan only catches "
              "known word/phrase-level tells.")
        return
    for category, hits in sorted(results.items(), key=lambda kv: -len(kv[1])):
        print(f"[{len(hits)}] {category}")
        if category == "Formatting tells":
            # This category is the most false-positive-prone: smart apostrophes
            # and curly quotes are correct in typeset prose. Flag it so a reviewer
            # doesn't treat every hit as something to strip.
            print("    (note: smart quotes/apostrophes and ellipses are only tells "
                  "for plain-text targets — code, Markdown source, plain email. "
                  "In finished typeset copy they're correct; ignore accordingly.)")
        seen_lines = set()
        for hit in hits[:8]:
            key = (hit["line"], hit["context"])
            if key in seen_lines:
                continue
            seen_lines.add(key)
            print(f"    line {hit['line']}: {hit['context']}")
        remaining = len(hits) - len(seen_lines)
        if remaining > 0:
            word = "hit" if remaining == 1 else "hits"
            print(f"    ... and {remaining} more {word} "
                  "(some may fall on lines already shown above)")
        print()


def main():
    parser = argparse.ArgumentParser(description="Scan text for AI writing pattern tells.")
    parser.add_argument("file", type=Path, help="Path to the text file to scan")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON instead of a printed report")
    args = parser.parse_args()

    if not args.file.exists():
        print(f"File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    results = scan_file(args.file)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print_report(results, args.file)


if __name__ == "__main__":
    main()
