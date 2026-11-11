---
name: humanizer-rbaddam
description: Use when text sounds AI-generated, over-formal, or stuffed with filler.
  Rewrites to be clean, direct, and human. Detects context (design doc, LLD/HLD, README,
  code comment, Slack, email) and adjusts tone accordingly. Preserves all technical
  terms, version numbers, and system identifiers exactly as-is.
---

# Humanizer

Rewrites text to remove AI writing patterns. Output: rewritten text only.

## Context

Read the context before rewriting. A Slack message and a design doc need different things.

| Context | Tone | Key rule |
|---------|------|----------|
| LLD / HLD / Design doc | Formal, precise | Technical accuracy first |
| README | Direct, scannable | Devs skim, not read |
| Code comments | Minimal | One purpose per comment |
| Email | Business casual | Get to the point |
| Slack | Casual, short | Skip the warm-up |
| General markdown | Match surrounding content | |

## Rules

**Never touch technical terms.** API names, product names, version numbers, domain terms (Kafka, Redis, PostgreSQL, Docker, Kubernetes, gRPC, OAuth, etc.) stay exactly as written. When in doubt, leave it.

**Cut, don't upgrade.** Remove the filler word. Don't swap it for a fancier one.

**Start with the point.** No warm-up sentence.

**"is/are/has" beats elaborate constructions.** "The service is..." beats "The service serves as..."

**Grammar doesn't have to be perfect.** Starting with "and" or "but" is fine. Fragments are fine in Slack and comments.

---

## AI Patterns to Remove

### 1. AI Vocabulary

Remove or replace with the plain alternative:

| Kill | Use instead |
|------|-------------|
| delve into | look at / cover / examine |
| leverage | use |
| utilize | use |
| pivotal, crucial, vital, key (filler adj) | [say what it actually does] |
| seamless, robust, scalable (as filler) | [state the actual property or metric] |
| showcase | show |
| underscore / highlight (verb) | show / mean |
| foster, cultivate | build / grow |
| garner | get |
| landscape (abstract noun) | [be specific] |
| tapestry | [be specific] |
| testament to | [delete — say what it does] |
| groundbreaking, cutting-edge, revolutionary | [say what's specifically new] |
| journey | process / path |
| evolving, ever-evolving | changing |
| synergy | [say what actually combines] |
| streamline | simplify / speed up |
| empower | let / allow / enable |
| holistic | [say the actual scope] |
| comprehensive | [say what it covers] |

### 2. Copula Avoidance

LLMs avoid "is/are/has" and dress up the verb. Undo it.

| Before | After |
|--------|-------|
| serves as the primary cache | is the primary cache |
| stands as an example of | is an example of |
| boasts 3 replicas | has 3 replicas |
| functions as a fallback | is a fallback |
| acts as the entry point | is the entry point |

### 3. Significance Inflation

Remove sentences that inflate importance without adding information:

- "This marks a pivotal moment in..."
- "This represents a shift in the evolving landscape of..."
- "This is a testament to the team's commitment to..."
- "...contributing to the broader ecosystem"
- "...setting the stage for future growth"

Just say what the thing does.

### 4. Promotional / Marketing Language

| Before | After |
|--------|-------|
| groundbreaking solution | [say what it solves] |
| seamless user experience | [say what's fast or smooth, with data if possible] |
| best-in-class performance | [state the actual metric] |
| vibrant, thriving community | active community |
| cutting-edge approach | [say what's new specifically] |

### 5. Superficial -ing Phrases

Present participle clauses tacked on to sound thorough but adding nothing:

- "...ensuring reliability" → [delete, or say how]
- "...highlighting the importance of..." → [delete]
- "...fostering collaboration..." → [delete]
- "...showcasing our commitment to..." → [delete]
- "...enabling teams to..." → rewrite as a sentence if it matters

If the clause carries real meaning, turn it into its own sentence.

### 6. Filler Phrases

| Before | After |
|--------|-------|
| In order to achieve this | To achieve this |
| Due to the fact that | Because |
| At this point in time | Now |
| It is important to note that | [delete, or just say it] |
| The system has the ability to | The system can |
| In the event that | If |
| At the end of the day | [delete] |
| Moving forward | [delete] |
| As mentioned earlier | [delete or restructure] |

### 7. Passive Voice Hiding the Actor

| Before | After |
|--------|-------|
| The request is processed by... | [X] processes the request |
| No configuration file needed | You don't need a config file |
| The results are preserved automatically | The system preserves results |
| Errors are handled gracefully | The service retries on failure (or say what actually happens) |

### 8. Em Dash Frequency

Humans use em dashes — but rarely, and inconsistently. One or two per page is fine. Five in three paragraphs is a signal.

Don't remove all em dashes. Reduce frequency and vary how you break up the sentence:

- "The service—which handles writes—also handles reads—on 3 nodes" → "The service handles both reads and writes. It runs on 3 nodes."
- One em dash in a paragraph: leave it alone.

Arrows (`→`) in tables, changelogs, or technical docs are fine. Don't touch them.

### 9. Boldface Overuse in Markdown

Bold only for genuine emphasis. Remove mechanical inline-header bolding in lists:

```
Before:
- **Performance:** Latency drops by 40% under load.
- **Reliability:** Retries are handled automatically.

After:
- Latency drops 40% under load.
- Retries are handled automatically.
```

### 10. Persuasive Authority Tropes

LLMs use these to sound like they're cutting through noise. They aren't.

| Before | After |
|--------|-------|
| At its core, what matters is | [say what matters] |
| The real question is | The question is |
| Fundamentally, this is about | [say what it's about] |
| The heart of the matter is | [say the matter] |
| What this really means is | [say what it means] |

### 11. Signposting / Announcements

| Before | After |
|--------|-------|
| Let's dive into how X works | X works by... |
| Here's what you need to know | [start with the content] |
| Let's explore the options | The options are... |
| Without further ado | [delete] |
| In this document, we will cover | [start covering it] |

### 12. Fragmented Headers

A heading followed by a sentence that just restates it:

```
Before:
## Performance
Performance is critical to user experience.
When load spikes, latency increases.

After:
## Performance
When load spikes, latency increases.
```

### 13. Negative Parallelisms

| Before | After |
|--------|-------|
| It's not just about X; it's about Y | [say Y] |
| Not merely a tool, but a platform | [say what the platform does] |
| It's not only faster, it's simpler | It's faster and simpler |

### 14. Vague Attributions

| Before | After |
|--------|-------|
| Experts argue that... | [name the source or delete] |
| Industry reports show... | [cite the report or delete] |
| Observers have noted... | [say who or delete] |
| It is widely believed that... | [cite or just assert] |

### 15. Generic Conclusions

Cut these endings:

- "The future looks bright..."
- "Exciting times lie ahead..."
- "...as we continue this journey toward excellence"
- "This represents a major step forward"

End on the last real point.

### 16. Perfect Parallel Structure

AI bullet lists have unnaturally consistent structure: same verb form, same approximate length, exactly N items. Real engineers write asymmetrically — one bullet is a sentence, one is three words, one has a caveat.

```
Before:
- Processes messages from the queue
- Validates the payload structure
- Stores results to the database
- Sends confirmation to upstream service

After:
- Reads messages off the queue, validates payload
- Stores results to the database
- Sends confirmation upstream (fire-and-forget, no retry)
```

Don't force symmetry. If two items naturally combine, combine them.

### 17. Neutralized Opinion

Engineers have takes. AI doesn't. If the original text expresses a preference or frustration, don't sand it down.

- "this approach has trade-offs" → restore "I don't love this but it's pragmatic"
- "there may be considerations" → restore "this is the wrong approach"
- "results may vary" → restore "this breaks under load, we've seen it"

When humanizing, preserve or strengthen the original stance. Don't hedge what wasn't hedged.

### 18. Informal abbreviations (Slack / comments only)

In casual contexts, engineers use shorthand. AI spells everything out uniformly.

In Slack messages and code comments, prefer:

| Spelled out | Shorthand |
|-------------|-----------|
| database | db |
| Kubernetes | k8s |
| environment | env |
| configuration | config |
| message | msg |
| service | svc |
| repository | repo |
| authentication | auth |

Don't apply this to design docs, READMEs, or emails — spell out there.

---

## Quick Reference: Most Common Fixes

| Pattern | Fix |
|---------|-----|
| "delve", "leverage", "utilize" | plain verb |
| "serves as / stands as / functions as" | "is" |
| "pivotal", "crucial", "vital" (filler) | delete or say why |
| 3+ em dashes per page | reduce frequency, vary substitution |
| Bold inline headers in lists | remove bold, flatten sentence |
| "It is important to note that" | delete |
| -ing tails (ensuring, fostering, showcasing) | delete or rewrite as sentence |
| "Let's dive into..." | start with the content |
| Generic final sentence | delete, end on real point |
| "seamless", "robust", "cutting-edge" | state actual property or delete |
| Perfectly parallel bullet list | break symmetry, combine where natural |
| Neutralized opinion | restore the original stance |
| Spelled-out terms in Slack/comments | use shorthand (db, k8s, env, config) |

---

## Example

**Before:**
> This document serves as a pivotal resource for understanding our event-driven architecture.
> Leveraging Kafka as our backbone, we have fostered a robust, scalable, and seamless data
> pipeline. The system boasts sub-50ms latency, ensuring real-time processing and highlighting
> our commitment to performance. Let's dive into the details.

**After:**
> This document covers our event-driven architecture. We use Kafka as the message backbone.
> The pipeline processes events with sub-50ms latency.

---

## Attribution

Pattern catalog based on [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
maintained by WikiProject AI Cleanup (CC BY-SA 4.0).

Skill framework derived from humanizer v2.5.1 (MIT license).
