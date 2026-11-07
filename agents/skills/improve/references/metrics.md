# Metrics and proportionate evaluation

## Define what a number means

For each metric specify the outcome it represents, type (`measurement`, `rating`, or `derived`), unit, direction, measurement/rubric, relevant cases/population, aggregation, baseline, useful target or minimum gain, failure/missing handling, and evidence source. Keep only fields relevant to the decision; no universal scorecard is required.

Direct measurements include completed/attempted tasks, elapsed time, actual cost, errors and token counts. Anchored ratings quantify judgments such as clarity or maintainability. Derived scores combine stated components. Keep these types distinguishable.

```yaml
metrics:
  - id: task_success
    type: measurement
    unit: fraction
    direction: maximize
    measure: completed_cases / attempted_cases
    cases: frozen representative cases
    target: 0.9
    failures: timeouts and invalid outputs count as unsuccessful
    missing: infrastructure failures reported separately; comparison incomplete until resolved
  - id: visual_hierarchy
    type: rating
    unit: anchored-1-to-5
    direction: maximize
    anchors:
      1: Primary and secondary actions compete.
      3: Primary action is identifiable but distractions remain.
      5: Primary action and reading order are immediately clear.
    intermediate_scores: use 2 or 4 only when evidence lies between adjacent anchors
    target: 4
    aggregation: report each reviewer plus median and range; missing ratings excluded with coverage stated
guardrails:
  - Keyboard navigation still completes the primary flow.
```

These targets are examples, not defaults. Use observed baselines; null means not measured. A target does not establish sample sufficiency. Never classify an unobserved property as passing.

## Conditional human calibration

Calibrate the objective and rubric when needed, not the model's supposed reliability. First use the request, established preferences and available examples. For a clear quantitative objective with known guardrails, proceed without a mandatory human checkpoint. For example, reducing measured latency while preserving correctness needs no preference survey.

Ask a concise question or present a small pair of examples when subjective success is unclear, rating anchors need the user's judgment, or a consequential tradeoff is unresolved. Numerical metrics do not remove preference questions: trading accuracy for speed still needs an agreed bound. Record the answer as criteria, anchors, criterion weights or guardrails before optimization. Continue independent preparation while awaiting input; elapsed time is not an answer.

Recheck calibration when a candidate changes the deal: a lower-quality fallback, reduced language coverage, increased default waiting time or a relaxed guardrail can introduce a preference question even after the initial metrics were clear. Reversible experiments may establish the options, but do not retain such a tradeoff as accepted or redefine success to fit the candidate without an existing user preference or a new answer. Describe the options in user-facing terms and keep an unapproved alternative provisional. Council agreement does not settle the user's preference.

At decision time, ask again only if unresolved preferences or a weight-sensitive choice would materially change the retained result. Do not ask merely because the reviewers differ; first verify their evidence. If calibration changes the rubric, cases or tradeoff policy, increment `evaluation_version` and re-evaluate the baseline and compared candidates under the new definitions. One preference answer does not establish a reviewer's reliability and never automatically changes council weights.

Reviewer weights come from the council's resolved configuration and express influence among reviewers. Criterion weights express importance among task outcomes. Keep these distinct in records and reports. When using anchored ratings, consume the council's per-criterion aggregates and individual ratings; do not perform a second reviewer-weighting pass. The improvement coordinator computes any explicitly chosen cross-criterion composite from those components. Essential missing ratings leave the aggregate unavailable.

## Comparison

- Match cases, environment and runtime/model settings as appropriate. Record conditions that differ intentionally (for example model selection). Use repeated trials when stochastic variation would change the decision.
- Retain/reject decisions compare a candidate with the retained best; reports compare the frozen original with the delivered version. Use the same evaluation version for both sides of either comparison.
- Report candidate minus baseline with units. For rates distinguish percentage points from relative percent change. Relative change is undefined at a zero baseline; report the absolute change instead. Lower-is-better metrics can have desirable negative deltas.
- For task outcomes, include successes and attempted-case counts. Separate infrastructure errors; do not silently drop model failures. Use a predeclared retry rule rather than selecting the best attempt after seeing results.
- Ratings are judgments, often ordinal. Show individual values and spread; median/range is a useful default. A mean or weighted rating is a decision convention, not a physical quantity or calibrated probability. Unknown ratings remain missing, never zero.
- Three judges reading the same measurement are not three trials. Repeated trials of one case are not independent tasks. Any uncertainty calculation must respect the sampling unit and dependencies.
- Preserve task slices that matter: overall gain can conceal an important regression. Small case sets support claims about those cases, not broad generalization.

## Optional combined score

Use a composite only when tradeoffs are wanted and weights are set before looking at candidates. Retain raw components. Hard constraints determine eligibility separately.

For bounded normalization, define meaningful fixed worst/best anchors. For higher-is-better use `u = (x - worst) / (best - worst)`; for lower-is-better use `u = (worst - x) / (worst - best)`. Require different anchors, state clipping to [0, 1] if used, and keep raw out-of-range values visible. Do not re-normalize to the current candidate pool: adding a candidate would change old scores.

Then `score = 100 * sum(weight_i * u_i)`, with nonnegative weights summing to 1. Missing essential components make the composite unavailable. Do not silently renormalize weights around missing data. Do not double-count overlapping metrics. Explain sensitivity if modest weight changes select a different candidate.

For an ordinal 1–5 rating, mapping it to utility assumes equal spacing; label that assumption. Often separate measurements and ratings are clearer than a composite. Council majority is not an optimization metric by default.

## Match evidence to the claim

- **UI:** matching viewports/states, actual rendered evidence and relevant interaction/accessibility checks. Rate hierarchy or clarity using anchors. Do not infer conversion improvements from model taste.
- **Writing:** explicit audience and editorial criteria; counts are measurements, persuasiveness/readability judgments are ratings. Preserving meaning can be a guardrail.
- **Prompt:** exact inputs/outputs and model/settings, representative successes and known failure modes; measure task success, length and cost where available. Use unseen cases/repeats for generalization claims, not every small rewrite.
- **Code:** relevant existing checks and a reproducible benchmark when performance is the goal; use the council for tradeoffs and defects checks cannot establish. More tests or fewer lines are not automatically better.
- **Agent/model behavior:** distinguish achieved outcomes from the trace, and measure redundant calls or latency without rewarding shortcut failures. Compare different models on comparable tasks; weight training needs a real, authorized training workflow.

Use traces to propose changes; they suggest causes rather than prove them. Keep stronger final-validation cases outside tuning when the claim warrants it. Reusing those cases for further optimization makes them development data. Judge agreement alone does not validate the evaluator; consequential claims need trusted labels or external outcome evidence.

## Small examples

UI hierarchy: ratings 2/3/2 before and 4/4/3 after support a favorable local judgment, while any failed keyboard-flow guardrail still blocks acceptance. Display all ratings, not just an average.

Prompt shortening: reducing median length from 200 to 150 words is a 50-word decrease (25%). If required-field success falls from 10/10 to 8/10 on the same cases, the brevity win does not satisfy a no-loss correctness guardrail.

Latency: a drop from 120 ms to 100 ms is a 20 ms decrease (about 16.7%). Without comparable warmup/load and enough repetitions, report it as an observation rather than a stable performance gain.
