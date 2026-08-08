# Implementation Prompt: Adaptive Intent → Workflow Engine

## Role

Act as a senior full-stack engineer implementing a production-quality feature in the existing application.

Do not treat this as a simple task-list feature or a fixed project-management workflow.

The core product idea is:

> **A user brings an intention, idea, question, learning goal, creative goal, or project. The AI externalizes that intention into an understandable, decomposed, executable workflow and then helps the user move through it one meaningful step at a time.**

The workflow must remain adaptive. The user can provide feedback, make decisions, challenge assumptions, change direction, or redefine the goal, and the AI should update the remaining workflow without destroying completed history.

---

# 1. Product Concept

The system should support arbitrary user intentions.

Examples:

### Learning

> "I want to learn quantum mechanics from scratch."

AI might create:

```text
Quantum Mechanics
├── 1. Establish prerequisites
│   ├── Review classical mechanics
│   ├── Understand waves
│   └── Review basic probability
│
├── 2. Build the conceptual foundation
│   ├── Wave-particle duality
│   ├── Superposition
│   └── Measurement
│
├── 3. Learn the mathematical model
│   ├── Complex numbers
│   ├── Wave functions
│   └── Schrödinger equation
│
├── 4. Test understanding
│   ├── Concept questions
│   ├── Problems
│   └── Explain-back exercise
│
└── 5. Consolidate
    ├── Identify weak areas
    └── Create next learning path
```

### Examining a preconceived belief

> "I believe social media is always harmful. Help me investigate whether that is true."

The workflow should not simply accept the premise.

It may create:

```text
Investigate the claim
├── Clarify the claim
├── Identify assumptions
├── Define "harmful"
├── Examine supporting evidence
├── Examine contradictory evidence
├── Separate correlation from causation
├── Evaluate edge cases
├── Update the original belief
└── Form a more precise conclusion
```

### Creative project

> "I want to create an art gallery."

Potential workflow:

```text
Art Gallery
├── Define concept
│   ├── Theme
│   ├── Audience
│   └── Curatorial intent
├── Develop collection
│   ├── Select artists
│   ├── Select works
│   └── Write descriptions
├── Design experience
│   ├── Physical/digital layout
│   ├── Ordering
│   └── Narrative
├── Promotion
└── Launch
```

### Content creation

> "Write a LinkedIn post about my experience building this product."

The workflow might become:

```text
LinkedIn Post
├── Identify story
├── Define takeaway
├── Gather concrete details
├── Draft hook
├── Draft body
├── Add lesson
├── Review tone
└── Publish-ready version
```

### Software project

> "Build a RAG system."

The same engine can produce a technical implementation workflow.

---

# 2. Core Product Principle

The workflow is **not merely a checklist**.

It is an external representation of:

* what the user is trying to accomplish;
* what needs to be understood;
* what decisions need to be made;
* what actions need to happen;
* what dependencies exist;
* what has already been completed;
* what remains uncertain;
* what the user should do next.

Think of it as:

```text
Human intention
      ↓
AI understanding
      ↓
Decomposition
      ↓
Structured workflow
      ↓
One doable next step
      ↓
User action / answer / reflection
      ↓
New information
      ↓
Workflow adapts
      ↓
Next doable step
```

The system should reduce cognitive load and maintain clarity.

---

# 3. Important UX Principle

Do NOT expose implementation terminology to the user.

Avoid showing:

* "interrupt"
* "state machine"
* "transition"
* "checkpoint ID"
* "optimistic lock"
* "workflow version"
* "LLM proposal"

Instead use human language:

* "A question for you"
* "Decision needed"
* "Review this plan"
* "Your next step"
* "Let's verify this"
* "Change direction"
* "We've updated your plan"
* "Completed"
* "Up next"

The complex state machine exists underneath the UI.

---

# 4. Frontend Experience

Build a new primary workflow experience called:

## Adaptive Workflow

The experience should appear inside the existing project/project-detail UI where appropriate.

The frontend should feel like an intelligent guide rather than a traditional project-management dashboard.

---

## 4.1 Workflow Overview

At the top:

```text
Build RAG Vector Engine

Understand      Plan          Execute         Verify
    ✓             ✓             ●               ○
────────────────────────────────────────────────────

Phase 1 · Foundation
```

The top-level phases should be generated dynamically.

Do not assume every workflow has:

```text
Understand → Blueprint → Build → Test
```

That is only an example.

A learning workflow might be:

```text
Orient → Learn → Practice → Test → Consolidate
```

An art project might be:

```text
Concept → Curate → Compose → Review → Publish
```

The UI must render whatever workflow structure the backend returns.

---

# 5. Workflow Tree / List-of-Lists

The main workflow should visually communicate hierarchy.

Example:

```text
✓ Understand the goal
  ✓ Clarify audience
  ✓ Define desired outcome

✓ Explore options
  ✓ Compare approaches
  ✓ Identify constraints

⚡ Create first draft
  ○ Draft opening
  ○ Develop main idea
  ○ Add conclusion

🔒 Review
🔒 Publish
```

The user should immediately understand:

1. where they are;
2. what they've completed;
3. what they are currently doing;
4. what comes next;
5. why future work is locked;
6. how much remains.

Avoid overwhelming the user with every low-level task if the workflow is large.

Use collapsible groups/phases.

---

# 6. Active Step / Checkpoint

The active item should be visually dominant.

Example:

```text
┌───────────────────────────────────────────────┐
│ ⚡ NEXT STEP                                  │
│                                               │
│ Define the audience                           │
│                                               │
│ Who is this LinkedIn post primarily for?     │
│                                               │
│ ○ Developers                                  │
│ ○ Founders                                    │
│ ○ AI practitioners                            │
│ ○ General professional audience               │
│                                               │
│ Why we're asking                              │
│ Your audience determines the depth and tone. │
│                                               │
│                 [ Continue → ]                 │
└───────────────────────────────────────────────┘
```

Every active step should communicate:

### What?

What does the user need to do?

### Why?

Why is this step relevant?

### What happens next?

What will this unlock?

---

# 7. Different Step Types

The frontend must support different interaction types.

At minimum:

### Question

User answers one or more questions.

### Choice

User selects from AI-generated options.

### Review

User reviews an AI-generated plan or artifact.

### Approval

User approves or requests changes.

### Action

User performs something outside the application and reports completion.

### Reflection

User explains what they learned, discovered, or changed.

### Validation

User confirms whether something is correct.

### Free-form input

User can explain something in their own words.

The backend should specify the interaction type and data required.

The frontend should render the appropriate form dynamically.

---

# 8. Human-in-the-Loop Principle

The AI should not silently make important assumptions.

When uncertainty matters, pause and ask.

For example:

```text
AI:
"I can take this in two directions."

A — Practical beginner tutorial
B — Technical deep dive

Which direction do you want?
```

The user's response becomes part of the workflow state.

The system then continues from that decision.

---

# 9. Adaptive Evolution / Change Direction

The user must be able to change their mind at any point.

Provide a subtle action near the active workflow:

> **Change direction**

Example:

```text
Change direction

┌───────────────────────────────────────────┐
│ I originally planned a physical gallery,  │
│ but I want to make it an online exhibition│
│ instead.                                  │
└───────────────────────────────────────────┘

[ Cancel ]             [ Update my workflow ]
```

After processing:

```text
✓ Workflow updated

Your completed work has been preserved.

Changed:
↻ Exhibition layout
↻ Artist presentation
↻ Promotion strategy

Preserved:
✓ Theme
✓ Artist selection
```

Never silently rewrite the user's history.

---

# 10. Completed History

Completed work should become lightweight history.

Example:

```text
✓ Define the project goal
  "Create an online exhibition exploring identity"
  Completed 10:42

✓ Select theme
  "Identity in the digital age"
  Completed 10:51

⚡ Select exhibition format
  Decision needed

🔒 Artist presentation
🔒 Website structure
```

The user should feel continuous progress.

---

# 11. Backend Architecture

Implement the feature using a deterministic workflow state machine.

The backend should have clear separation between:

```text
API
 ↓
Workflow State Machine
 ↓
Validation / Business Rules
 ↓
AI Proposal Layer
 ↓
Persistence
```

The AI must never directly mutate workflow state.

---

# 12. Core Domain Objects

Implement concepts equivalent to:

## Workflow

```text
workflow_id
project_id
workflow_version
plan_version
status
active_checkpoint_id
created_at
updated_at
```

## Checkpoint

```text
checkpoint_id
plan_version
sequence
parent_id
title
description
checkpoint_type
status
metadata
created_at
completed_at
```

Checkpoint IDs must be immutable.

Never use an array index as checkpoint identity.

---

# 13. Checkpoint Status

Use explicit lifecycle states.

At minimum:

```text
PENDING
WAITING_FOR_INPUT
ACTIVE
COMPLETED
SUPERSEDED
FAILED
```

Define legal transitions.

Do not allow arbitrary status mutation.

For example:

```text
PENDING
   ↓
ACTIVE
   ↓
WAITING_FOR_INPUT
   ↓
COMPLETED
```

Invalid transitions must be rejected.

---

# 14. Interrupt / Interaction Payload

Represent the current user interaction separately from the checkpoint.

Conceptually:

```python
InterruptPayload:
    interrupt_id
    schema_version
    checkpoint_id
    type
    title
    prompt_message
    options
    data
    created_at
```

Supported interaction types should be extensible.

Do not hard-code the frontend around only four workflow types.

The system should be capable of adding future interaction types.

---

# 15. Typed User Responses

Do not blindly accept:

```python
resume_data: Dict[str, Any]
```

as trusted data.

Use typed schemas per interaction type.

Examples:

```text
DiagnosticResponse
ChoiceResponse
ApprovalResponse
ValidationResponse
ReflectionResponse
FreeformResponse
```

The workflow engine should dispatch the active interaction to the correct Pydantic validator.

Invalid responses must leave the workflow unchanged.

---

# 16. AI Proposal Layer

Create an abstraction:

```text
AIProposalEngine
```

It should generate structured proposals.

Examples:

```text
DiagnosticProposal
WorkflowProposal
CheckpointProposal
EvolutionProposal
```

The AI produces a proposal.

The workflow engine validates the proposal.

Only then can it be persisted.

Never allow:

```text
LLM → database
```

Use:

```text
LLM
 ↓
Structured proposal
 ↓
Pydantic validation
 ↓
Business-rule validation
 ↓
State-machine validation
 ↓
Database
```

---

# 17. AI Must Be Flexible About the Domain

Do not hard-code assumptions that the workflow is software development.

The AI should infer the appropriate workflow structure from the user's intent.

For example:

```text
"Learn photography"
```

should produce a learning workflow.

```text
"Plan my wedding"
```

should produce an organizational workflow.

```text
"Write a LinkedIn post"
```

should produce a content workflow.

```text
"Investigate whether my belief about X is correct"
```

should produce an inquiry/reasoning workflow.

The engine should support arbitrary domains.

---

# 18. Workflow Generation Requirements

When generating a workflow, the AI should optimize for:

* clarity;
* manageable steps;
* logical dependencies;
* meaningful milestones;
* appropriate granularity;
* minimal unnecessary work;
* user decisions where human judgment matters;
* verification where correctness matters.

Avoid generating 100 tiny tasks when 8 meaningful steps would be clearer.

Avoid vague tasks such as:

> "Work on the project."

Prefer:

> "Write a one-sentence description of the audience."

Every task should be actionable or cognitively meaningful.

---

# 19. Task Granularity

The AI should recursively decompose work until the next action is realistically doable.

Bad:

```text
Build the website
```

Better:

```text
Define website purpose
  ↓
Identify target audience
  ↓
List required pages
  ↓
Choose visual direction
  ↓
Draft homepage structure
```

But do not recursively decompose forever.

Define sensible limits:

```text
maximum workflow depth
maximum checkpoints
maximum children per node
```

The AI must stay within those constraints.

---

# 20. Optimistic Concurrency

Every workflow mutation must include:

```text
expected_version
```

The server must re-check the version inside the final short database transaction.

Never trust the version checked before an LLM call.

Correct pattern:

```text
Read state
 ↓
Validate
 ↓
AI proposal
 ↓
Validate proposal
 ↓
BEGIN TRANSACTION
 ↓
Re-read workflow
 ↓
Verify expected_version
 ↓
Verify active checkpoint
 ↓
Apply transition
 ↓
Increment workflow_version
 ↓
Persist event
 ↓
COMMIT
```

If another request changed the workflow:

```text
409 Conflict
```

The frontend should fetch the latest state and explain the situation naturally.

---

# 21. Idempotency

All mutating operations must be safely retryable.

At minimum:

```text
start
resume
evolve
```

must support idempotency.

Persist idempotency records with:

```text
idempotency_key
request_hash
transition_id
result
created_at
```

Enforce uniqueness at the database level.

If the same request is retried:

```text
return previous result
```

If the same key is reused with different request data:

```text
reject request
```

Never execute the transition twice.

---

# 22. Evolution Safety

Completed checkpoints are immutable.

Evolution may modify only unresolved future work.

Example:

```text
✓ A
✓ B
⚡ C
○ D
○ E
```

User changes direction.

Allowed:

```text
✓ A
✓ B
↻ C
↻ D
↻ E
```

Not allowed:

```text
rewrite A
rewrite B
```

Preserve history.

Record:

```text
plan_version 1
    ↓
plan_version 2
```

with an immutable evolution event containing the user's rationale.

---

# 23. Separate Versions

Do not confuse:

### workflow_version

Used for optimistic concurrency.

```text
17 → 18 → 19
```

### plan_version

Used for workflow evolution.

```text
v1 → v2 → v3
```

### checkpoint_id

Immutable identity.

These three concepts must remain separate.

---

# 24. Audit Events

Persist an append-only event history.

At minimum:

```text
WORKFLOW_STARTED
WORKFLOW_GENERATED
INTERRUPT_CREATED
INTERRUPT_RESUMED
CHECKPOINT_COMPLETED
WORKFLOW_EVOLVED
CHECKPOINT_SUPERSEDED
WORKFLOW_COMPLETED
WORKFLOW_FAILED
```

Events should contain:

```text
event_id
project_id
workflow_version
plan_version
checkpoint_id
actor_id
event_type
payload
timestamp
```

Never expose sensitive internal information in user-visible event payloads.

---

# 25. Database Transactions

Never keep a database transaction open while calling an LLM.

AI calls can be slow or fail.

Use:

```text
AI call
 ↓
proposal validation
 ↓
short transaction
```

If AI generation fails:

```text
do not mark checkpoint completed
do not advance workflow
do not corrupt state
```

The user should be able to retry.

---

# 26. AI Failure Handling

Do not expose provider-specific errors to the user.

Instead:

```text
Something went wrong while preparing your next step.

Your previous response is saved.
Nothing was lost.

[ Try again ]
```

If a deterministic fallback exists, it must still pass:

```text
schema validation
+
business validation
```

Never claim that schema-valid output is automatically semantically correct.

Prefer conservative fallback behavior.

---

# 27. API

Implement resource-oriented endpoints:

```http
POST /api/v1/projects/{project_id}/workflow/start

GET /api/v1/projects/{project_id}/workflow

POST /api/v1/projects/{project_id}/workflow/resume

POST /api/v1/projects/{project_id}/workflow/evolve
```

Responses should return the latest authoritative workflow state.

Mutation responses should include a transition envelope:

```json
{
  "transition": {
    "transition_id": "...",
    "type": "checkpoint_resumed",
    "workflow_version_before": 7,
    "workflow_version_after": 8
  },
  "workflow": {}
}
```

---

# 28. HTTP Semantics

Use predictable responses:

```text
200  successful read/mutation
201  workflow created
400  malformed request
403  unauthorized
404  project/workflow not found
409  stale version / invalid state / inactive checkpoint
422  typed payload validation failure
503  temporary AI/service failure
```

The frontend should convert technical errors into understandable UX.

---

# 29. Frontend State Ownership

The server is authoritative.

React should render server state.

Do not let React independently calculate workflow truth.

For example, do not implement:

```text
if previousTaskComplete:
    unlockNextTask
```

Instead:

```text
server says:
checkpoint.status = PENDING
```

and render it as locked.

After every mutation:

```text
POST
 ↓
receive authoritative workflow state
 ↓
replace local workflow state
 ↓
render
```

This makes refreshes and multiple browser tabs safe.

---

# 30. Frontend Conflict Handling

If a second tab changes the workflow:

Do not display:

```text
409 Conflict
```

Instead:

```text
This workflow was updated elsewhere.

We've loaded the latest version for you.
```

Then refresh the workflow state.

---

# 31. Frontend Components

Create a reusable structure such as:

```text
AdaptiveWorkflow
├── WorkflowHeader
├── WorkflowProgress
├── WorkflowTree
│   ├── WorkflowPhase
│   └── WorkflowCheckpoint
├── ActiveStepCard
│   ├── QuestionStep
│   ├── ChoiceStep
│   ├── ReviewStep
│   ├── ApprovalStep
│   ├── ValidationStep
│   └── ReflectionStep
├── EvolutionControl
├── WorkflowHistory
└── WorkflowCompletion
```

Do not make the component specific to RAG, software development, learning, or any single domain.

---

# 32. Visual Design

Use the application's existing visual language.

The workflow should feel:

* calm;
* focused;
* progressive;
* intelligent;
* lightweight;
* clear.

Avoid turning it into an enterprise Gantt chart.

The primary visual hierarchy should be:

```text
1. What should I do now?
2. Why am I doing it?
3. What have I accomplished?
4. What comes next?
5. How can I change direction?
```

The current action is more important than the entire task tree.

---

# 33. Completion Experience

When the workflow finishes:

```text
✓ Complete

You worked through:

8 meaningful steps
3 decisions
2 revisions
1 final result

[ View what we accomplished ]
[ Continue exploring ]
```

The completion UI should work for learning, creative work, planning, writing, and software projects.

Do not assume "completion" always means shipping software.

---

# 34. Tests

Implement defensive tests for:

### Basic

```text
start
→ generated workflow
→ first interaction
→ response
→ next step
→ completion
```

### Different domains

Test workflow generation for:

```text
learning
creative
content
planning
software
belief/inquiry
```

### Idempotency

Submit identical request twice.

Expected:

```text
one transition
one version increment
one resulting state
```

### Concurrent requests

Two requests use the same version.

Expected:

```text
one succeeds
one receives 409
```

### Stale checkpoint

Attempt to resume an old checkpoint.

Expected:

```text
409
state unchanged
```

### Invalid response

Expected:

```text
422
state unchanged
```

### Evolution

Verify:

```text
completed history preserved
future checkpoints superseded
new plan version created
new checkpoints generated
```

### AI failure

Mock AI timeout/error.

Expected:

```text
no corruption
checkpoint remains recoverable
retry works
```

### Server restart

Start workflow, restart application, reload.

Expected:

```text
workflow resumes from persisted state
```

### Duplicate start

Submit start twice.

Expected:

```text
no duplicate active workflows
```

---

# 35. Manual Acceptance Test

Use these examples in the UI.

## Test A — Learning

Input:

> "I want to understand machine learning from scratch."

Expected:

* AI asks about current knowledge if necessary.
* AI creates a learning workflow.
* Workflow contains meaningful conceptual progression.
* User completes one learning step.
* Next step appears.
* User can say "I already know linear regression."
* AI removes/supersedes unnecessary future work while preserving history.

---

## Test B — Preconceived belief

Input:

> "I think social media is always harmful. Help me investigate this."

Expected:

* AI does not blindly validate the premise.
* Workflow distinguishes claim, assumptions, evidence, counterexamples, and conclusion.
* User can revise their belief.
* Workflow adapts.

---

## Test C — Art gallery

Input:

> "I want to create an online art gallery."

Expected:

```text
Concept
→ Curatorial direction
→ Artist/work selection
→ Exhibition structure
→ Presentation
→ Review
→ Launch
```

But the exact workflow should be AI-generated.

---

## Test D — LinkedIn post

Input:

> "I want to write a LinkedIn post about building this product."

Expected:

```text
Find story
→ Define audience
→ Identify takeaway
→ Draft
→ Review
→ Refine
→ Publish
```

The active checkpoint should ask only for the information needed at that moment.

---

# 36. Critical Defensive Invariants

The implementation is not complete unless these invariants hold:

1. **The server owns workflow truth.**
2. **Checkpoint IDs are immutable.**
3. **Completed work cannot be silently rewritten.**
4. **Every mutation is concurrency-safe.**
5. **Every mutation is idempotent.**
6. **AI cannot directly mutate persistent state.**
7. **AI proposals require deterministic validation.**
8. **Invalid user input does not change state.**
9. **AI failure does not corrupt state.**
10. **Workflow evolution preserves history.**
11. **The system supports arbitrary domains.**
12. **The frontend never assumes the workflow is a software-development workflow.**
13. **The user always knows what to do next.**
14. **The user can understand why the current step exists.**
15. **The user can change direction without losing completed work.**

---

# 37. Implementation Strategy

Do not attempt to implement everything simultaneously.

Implement in this order:

### Phase 1 — Domain model

Create:

* Workflow
* Checkpoint
* Interrupt
* Workflow event
* versioning
* statuses

### Phase 2 — Deterministic state machine

Implement:

* start
* activate checkpoint
* resolve checkpoint
* complete checkpoint
* advance
* complete workflow

No AI dependency yet.

### Phase 3 — Typed interactions

Implement:

* question
* choice
* review
* approval
* validation
* reflection

### Phase 4 — AI proposal engine

Add:

* intent analysis
* workflow generation
* checkpoint generation
* evolution proposals

AI remains non-authoritative.

### Phase 5 — Defensive persistence

Add:

* optimistic locking
* idempotency
* atomic transitions
* audit events

### Phase 6 — Frontend

Implement:

* workflow progress
* hierarchical workflow tree
* active interaction card
* completed history
* evolution UI
* loading/error/conflict states

### Phase 7 — Integration

Connect real AI generation to the workflow engine.

### Phase 8 — Tests

Run the complete defensive matrix.

---

# 38. Important Implementation Rule

Before modifying files, inspect the existing repository.

Understand:

* existing project model;
* existing blueprint representation;
* existing workflow implementation;
* existing API conventions;
* authentication/authorization;
* frontend routing;
* existing project UI;
* existing AI/provider abstraction;
* existing database technology;
* existing tests.

Do not blindly create parallel architecture if an existing abstraction can be extended safely.

Prefer incremental integration over unnecessary rewrites.

---

# 39. Final Product Definition

The finished feature should make the user feel:

> **"I don't have to hold the entire problem in my head anymore."**

They provide an intention.

The AI turns it into a structured map.

The system presents one meaningful next action.

The user responds.

The map evolves.

Progress remains visible.

Completed thinking and work remain preserved.

When the user changes their mind, the system adapts instead of forcing them to restart.

The fundamental loop is:

```text
INTENTION
    ↓
UNDERSTAND
    ↓
DECOMPOSE
    ↓
SHOW MAP
    ↓
ONE DOABLE STEP
    ↓
USER RESPONSE / ACTION
    ↓
LEARN FROM RESULT
    ↓
UPDATE MAP
    ↓
NEXT DOABLE STEP
    ↓
...
    ↓
OUTCOME
```

Build the implementation around this loop, not around the original example of a software-project workflow.
