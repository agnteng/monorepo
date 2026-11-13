# 0001. Event data has one home

- Status: Accepted
- Date: 2026-11-13

## Context
Each event's city, date, venue, Luma ids and speakers were written in the
deck's `content.ts`, again in the event README, and again by hand in talk
descriptions, and the copies drifted (a speaker's short name in the deck,
his full name on his slides).

## Decision
`content/<date>/event.json` is the only place an event's identity is written.
Decks import it as `@content/<date>/event.json`; the scripts and skills read
it. Nothing copies its values into code.

## Consequences
Changing a speaker or venue is one edit. The fitness check validates every
`event.json` against the expected shape.
