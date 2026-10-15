# Perspective query kernel

`lib/domain/perspective-query.ts` defines the pure evaluator for version 2 perspective definitions and the shared semantics used to translate version 1 filters. `evaluatePerspectiveQuery` accepts a catalog and already projected readonly Actions, preserving each input row subtype and order when no sort is requested. `evaluatePerspective` accepts an explicit read time, uses the existing `project()` result, and returns the normal projected row shape. Version 1 requests keep their legacy defaults; version 2 query definitions are persisted and returned as the `query` member of the explicit union.

The query object accepts only `where` and `order_by`. Conditions are nonempty recursive `and`/`or`, unary `not`, or field/operator/value leaves. Project and Tag leaves support `eq`, `ne`, `in` and `not_in`; Status supports the same operators; Flag and Defer support `eq` and `ne`. Empty `in` sets match nothing and empty `not_in` sets match everything. Negation applies to the complete positive match. Null in Project or Tag predicates means unassigned or untagged. Tag sets match any overlapping association. Classification leaves default `include_descendants` to true during normalization; false restricts them to the referenced node. Classification hierarchy is independent of Action containment.

Normalization accepts plain data records with exact keys and dense, undecorated arrays. It rejects accessors, symbols, non-enumerable keys, invalid UUIDs, and explicit `undefined` values. Resource preflight is iterative and checks array cardinality before reading child values; logical normalization follows only after its depth and node budgets pass. Reference collection includes UUIDs under negative operators and `not`, and owner-snapshot validation checks every referenced Project and Tag.

| Limit | Bound | Purpose |
| --- | ---: | --- |
| Condition depth | 32 | Bounds nested logical evaluation and normalization recursion. |
| Condition nodes | 256 | Bounds AST traversal and compiled predicate construction. |
| Total predicate candidates | 256 | Bounds scalar and set values across the AST, including candidates under negative predicates. |
| Sort keys | 8 | Allows one key for each supported Action field. Repeated keys are valid. |

These shape and scalar limits bound the normalized query itself; the kernel does not add a second JSON-byte acceptance limit. The measurement harness emits normalized query sizes and synthetic, escaped perspective-row delta/bulk sizes for representative and combined maximum-bound ASTs. Version 2 query ASTs are persisted through the physical JSON column at the storage boundary; the 100,000-byte per-value and 524,288-byte aggregate commit-plan checks in `lib/data/model/storage.ts` remain authoritative for persisted definitions and complete write plans.

Sorting supports due date, Defer date, creation/update time, title, status, direct Flag and saved order. Null placement is independent of direction and defaults to last. Status uses active, on-hold, completed, dropped order; strings use deterministic code-unit order; ties resolve by Action ID ascending. Omitted `order_by` preserves the input order, while an explicit empty list sorts globally by ID. Dates use saved Action values, not inherited Defer dates.
