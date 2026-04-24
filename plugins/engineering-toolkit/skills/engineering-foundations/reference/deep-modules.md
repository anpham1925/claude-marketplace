# Deep Modules

From John Ousterhout, *A Philosophy of Software Design*.

A **deep module** has a **small interface** and a **large implementation**. The ratio of complexity hidden to complexity exposed is what makes a module valuable — the deeper, the better.

```
┌─────────────────────┐
│   Small Interface   │  ← Few methods, simple params
├─────────────────────┤
│                     │
│  Deep Implementation│  ← Complex logic hidden
│                     │
└─────────────────────┘
```

A **shallow module** exposes almost as much as it hides — the interface is close in size to the implementation. Shallow modules are tax without benefit: callers pay the cognitive cost of a boundary and get little abstraction in return.

```
┌─────────────────────────────────┐
│       Large Interface           │  ← Many methods, complex params
├─────────────────────────────────┤
│  Thin Implementation            │  ← Just passes through
└─────────────────────────────────┘
```

## Why This Matters for Us

- **Testability**: deep modules are tested at their interface — behavior-level, survives refactors. Shallow modules push testing inward toward implementation details, producing brittle tests that break on refactor without behavior change.
- **AI-navigability**: deep modules let an agent (or a human) understand one concept without bouncing across many small files. Shallow modules force context-thrashing.
- **Review cost**: a reviewer can evaluate a deep module by reading its interface and picking one or two internals. A shallow module forces them to read everything.

## Questions to Ask When Designing

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?
- Could two adjacent shallow modules be merged into one deeper module?
- Is there a pure function extracted *only for testability* that should be inlined once we have boundary tests?

## Interaction with Our Pipeline

- **Logical Design**: when comparing patterns, prefer the option with fewer entry points and simpler contracts. Depth > flexibility when they conflict.
- **Construct**: within a wave, if a subagent finds itself writing a shallow adapter, pause and check whether the layer is needed at all.
- **Red Team**: a shallow-but-widely-used module is a concurrency/partial-failure magnet — every caller invents its own guards. Flag as architectural risk.
- **Refactor**: merging shallow modules is a higher-value refactor than renaming or reformatting. It usually lets you delete tests too.

## Tests: "Replace, Don't Layer"

When you deepen a module, the unit tests that existed on the now-absorbed inner modules become waste — delete them. Keep only the boundary tests on the deepened module. Layering new boundary tests on top of old inner-unit tests doubles maintenance and mutes the refactor benefit.

## Dependency Categories

When considering whether a module can be deepened, classify its dependencies:

| Category | Example | Deepenable? |
|---|---|---|
| **In-process** | pure compute, in-memory state | Always — merge and test directly |
| **Local-substitutable** | Postgres (via PGLite), filesystem (via memfs) | Yes if the substitute exists — test with it in CI |
| **Remote-but-owned** | internal microservice over HTTP/gRPC | Yes via ports & adapters — HTTP adapter in prod, in-memory adapter in tests |
| **True external** | Stripe, Twilio, OAuth providers | Yes with a mock adapter at the boundary |

The key move in all four: the deepened module owns the logic; the transport/IO is injected. Tests exercise the logic through a lightweight adapter; prod wires in the real one.
