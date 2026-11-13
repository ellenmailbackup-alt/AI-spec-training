# Use-Case 3.0 — Core Concepts & Slicing (Jacobson, Spence, de Mendonca — Dec 2024)

Source: Use-Case 3.0 by Ivar Jacobson International (see ivarjacobson.com)

## Core Concepts

- **Use Case** — all the ways of using a system to achieve a goal of a particular user
- **Basic Scenario** — the normal happy path to value (implement this first)
- **Extensions** — alternative paths and error handling (implement incrementally)
- **Use-Case Slice** — a slice of a use case that provides clear value to stakeholders; includes a requirements slice and a test slice
- **Use-Case Model** — the big picture of all useful ways to use the system
- **Work Item** — small actionable piece of work (user story, task) derived from a slice

## Slicing Principles

- **Implement in stages** — deliver key scenarios early, add less critical ones over time
- **Build the system in slices** — each slice is one or more paths through a use case plus the relevant design, code, and tests

## Use-Case Slicing Rules

1. **Start with the basic scenario** — the first slice is always based on the basic scenario
2. **Each slice traverses start to finish** — always starts with the use case trigger, always ends with the use case termination
3. **Each slice provides value** — either by reaching the user's goal or by defining how an error is handled
4. **Not all extensions need slicing** — leave unimportant extensions unsliced; slice only what's needed now
5. **Multiple slices from basic scenario** — it's OK to split the basic scenario (e.g., buy 1 product vs. buy 100 products)
6. **Slices can combine related extensions** — group conceptually related scenarios into one slice (e.g., all payment-related errors)
7. **Slices are testable** — each slice must have test cases that define "done"
8. **Slices drive user stories** — each step in a slice can become a user story; each extension can become a user story
9. **Estimate slices** — use relative sizing (story points, t-shirt sizes)
10. **Prioritize slices** — use MoSCoW or similar; focus on smallest usable system first

## Use-Case Slice Lifecycle

A slice progresses through:
1. **Identified** — scope and scenarios known
2. **Defined** — scenarios elaborated, test cases identified, effort estimated
3. **Prepared** — work items (user stories) created, added to backlog
4. **Implemented** — system enhanced, ready for testing
5. **Verified** — tests passed, ready for release

## From Slices to User Stories

Each use-case slice generates one or more user stories:
- Each **step** in the basic scenario → one or more user stories
- Each **extension** → one or more user stories
- Add **technical stories** for spikes, integration, and end-to-end testing of the slice
- The slice acts as the **team goal**; individual stories are the work items within it
