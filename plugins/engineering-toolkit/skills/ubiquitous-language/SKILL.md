---
name: ubiquitous-language
description: "Extract a DDD-style ubiquitous language glossary from the current conversation (or a provided artifact), flagging ambiguities and proposing canonical terms. Writes UBIQUITOUS_LANGUAGE.md to the working directory. Use when the user wants to define domain terms, harden terminology, build a glossary, or mentions 'ubiquitous language', 'domain vocabulary', or 'glossary'. Also invoked by ai-dlc-domain-design as a precursor step before identifying aggregates."
argument-hint: '[path/to/source.md | conversation]'
model: opus
---

> **Recommended model: Opus** — Pattern recognition across domain terms and picking canonical names is reasoning-heavy.

## Agent: Glossarist

**Mission**: Extract domain terminology from the conversation (or a provided artifact), pick canonical terms, flag ambiguities, and write a glossary that the team can hold each other to.

**Inputs**: The current conversation, or a file path passed as argument (e.g. `discovery.md`, `inception.md`, a Slack thread dump)
**Outputs**: `UBIQUITOUS_LANGUAGE.md` in the working directory (or `docs/<identifier>/UBIQUITOUS_LANGUAGE.md` if invoked inside an ai-dlc pipeline with an identifier present)

**Definition of Done**:
- Every domain-relevant noun/verb from the source has been considered — either included as a canonical term, merged into an alias, or deliberately excluded as non-domain
- Each term has a one-sentence definition of what it IS (not what it does)
- Aliases to avoid are listed for every term that had competitors
- Ambiguities (same word → two concepts) are flagged with a resolution recommendation
- Relationships between terms are stated where cardinality is non-obvious
- An example dialogue uses the canonical terms in context
- File written; summary printed inline

## Why This Skill Exists

`ai-dlc-domain-design` jumps straight to aggregates and events, but those artifacts only stick if the team has already agreed on what to *call* things. Drift in terminology — "account" meaning both Customer and User, "order" and "purchase" used interchangeably — silently compounds into drift in the model. This skill catches it early, in plain English, before any code is written.

## Steps

### 1. Gather the source material

- **Argument provided**: read the file at that path.
- **No argument**: use the current conversation as the source. Scan messages for domain-relevant nouns, verbs, and concepts.
- **Inside an ai-dlc pipeline**: also read `docs/<identifier>/discovery.md` and `docs/<identifier>/inception.md` if they exist.

### 2. Extract candidate terms

List every noun/verb that might be part of the domain. Do NOT include:
- Generic programming concepts (array, endpoint, service) unless they carry domain meaning
- Module names or class names unless those names have real meaning in the domain
- Internal technical jargon with no business meaning

### 3. Identify problems

Walk the candidate list and mark each one with:
- **Ambiguity**: same word used for different concepts in the source (e.g. "account" = Customer AND User)
- **Synonyms**: different words used for the same concept (e.g. "buyer" / "customer" / "purchaser")
- **Vagueness**: term is used but never pinned down (e.g. "transaction" used loosely)

### 4. Pick canonical terms — be opinionated

For each ambiguity or synonym cluster, pick the single best term. Reasoning:
- Prefer business-domain terms over technical terms (Customer > Account)
- Prefer terms that already appear in the codebase/tickets if consistent
- Prefer terms that disambiguate — if two concepts exist, pick names that force the distinction

**Do not present options.** Pick one. Aliases get demoted to "avoid" — that's what makes the glossary load-bearing.

### 5. Define each term

One sentence. Define what it IS, not what it does.

- BAD: "An Invoice generates payment requests for customers after delivery."
- GOOD: "A request for payment sent to a customer after delivery."

### 6. Capture relationships

Where cardinality or sequencing isn't obvious from the definitions, add a short "Relationships" section with bulleted facts in the form:
- An **Invoice** belongs to exactly one **Customer**
- An **Order** produces one or more **Invoices**

Keep it tight — 5-10 bullets max. If you need more, you haven't finished picking canonical terms.

### 7. Write the example dialogue

A 3-5 exchange conversation between a dev and a domain expert that naturally uses the canonical terms. Its job: demonstrate that the terms *work together* in practice, and that the boundaries between related concepts hold up under pressure.

If writing the dialogue feels forced, that's a signal the glossary is still off — revise the terms, then retry the dialogue.

### 8. Group into sections if natural

If terms cluster cleanly (by lifecycle, by actor, by subdomain), split into multiple tables with headings. One table per cluster. If everything is one cohesive domain, one table is fine — don't force groupings.

### 9. Write `UBIQUITOUS_LANGUAGE.md`

Use this structure:

```markdown
# Ubiquitous Language

## {Cluster name — e.g. "Order lifecycle"}

| Term | Definition | Aliases to avoid |
|------|-----------|------------------|
| **Term1** | One-sentence definition of what it IS | synonyms, near-misses |
| **Term2** | ... | ... |

## {Next cluster — e.g. "People"}

| Term | Definition | Aliases to avoid |
|------|-----------|------------------|
| ... | ... | ... |

## Relationships

- An **A** belongs to exactly one **B**
- A **B** produces one or more **C**

## Example dialogue

> **Dev:** "..."
> **Domain expert:** "..."
> **Dev:** "..."
> **Domain expert:** "..."

## Flagged ambiguities

- "account" was used to mean both **Customer** and **User** — resolved: **Customer** places orders, **User** is an authentication identity.
```

### 10. Print a summary inline

After writing the file, print:
- Where it was written
- Count of terms (and per cluster if grouped)
- Count of flagged ambiguities
- The single most load-bearing ambiguity that was resolved (if any)

### 11. Re-running in the same conversation

When invoked again against the same workspace:
1. Read the existing `UBIQUITOUS_LANGUAGE.md`
2. Fold in any new terms from subsequent discussion
3. Update definitions if understanding has evolved
4. Re-flag any new ambiguities
5. Rewrite the example dialogue to naturally include new terms
6. Never silently drop a term that was in the previous version — if removing it, flag the removal

## Integration with ai-dlc

- `ai-dlc-domain-design` should invoke this skill as a first step (before identifying aggregates) when the source material contains unfamiliar or conflicting terminology. This ensures aggregates are named with ubiquitous-language terms — satisfying the phase's existing DoD.
- `ai-dlc-discovery` may invoke it opportunistically at checkpoint time if the 6 forcing questions surfaced new vocabulary.

## Rules

- **Be opinionated.** Pick one canonical term per concept. Don't present alternatives — demote them to aliases.
- **Define what things ARE, not what they DO.** One sentence max.
- **Flag conflicts explicitly.** An ambiguous term gets a "Flagged ambiguities" entry with a recommended resolution.
- **Only include domain terms.** Skip generic programming concepts, module names, and class names unless they carry business meaning.
- **Always write the example dialogue.** If the dialogue feels awkward, the glossary is wrong — iterate.
- **Never fabricate terms not present in the source.** The glossary formalizes what's already being said, it doesn't invent vocabulary.
- **NEVER** write UBIQUITOUS_LANGUAGE.md to a nested directory without checking that the directory exists; use the working directory by default.
