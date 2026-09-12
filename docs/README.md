# Project Documents

This folder holds the project memory for the AI-native card game MVP. Use this page as the entry point so future work can load only the document needed for the current small task.

比喻：這份 README 像圖書館櫃台。先來這裡看哪本書放哪裡，不要每次把整個書架搬進上下文。

## Start Here

1. [GOAL.md](./GOAL.md)
   - Current product goal, local-first direction, skill usage rules, and high-level data flow.
   - Read this when deciding what the next small task should be.

2. [../Agent.md](../Agent.md)
   - Collaboration rules for this project.
   - Read this when the agent behavior or working style is unclear.

3. [../CONTEXT.md](../CONTEXT.md)
   - Domain glossary.
   - Read this when terminology is unclear or when adding a new domain term.

## System Design

- [photo-to-character-mental-model.md](./photo-to-character-mental-model.md)
  - Mental model for `Source Photo -> Photo Analysis -> Character Spec -> Card Cover -> Battle Card`.
  - Read this before changing the photo-to-character pipeline or splitting modules.

- [LOCAL_IMAGE_GENERATION.md](./LOCAL_IMAGE_GENERATION.md)
  - Local image generation strategy for MacBook Air M3 / 16 GB.
  - Read this before working on ComfyUI, SD1.5, SDXL-Lightning, Draw Things, MFLUX, or image generation adapters.

## Product And UX

- [UI_REFERENCE.md](./UI_REFERENCE.md)
  - UI direction from the supplied reference images and Hearthstone-like card movement.
  - Read this before changing the generator UI, card library, character detail, or battle screen.

- [CHARACTER_QUESTIONS.md](./CHARACTER_QUESTIONS.md)
  - Draft questionnaire for consent, role, backstory, values, weakness, signature item, and optional capture context.
  - Read this before changing the user question form or mapping answers to Character Spec.

- [REFERENCE_GAMES.md](./REFERENCE_GAMES.md)
  - Creative references such as Photo Dojo, Face Raiders, Monster Rancher, Pokemon GO, and Pikmin Bloom.
  - Read this when discussing similar mechanics or validating the creative direction.

## Root-Level Runtime Docs

- [../README.md](../README.md)
  - How to run the current local MVP.
  - Read this when starting or testing the app.

## How To Use These Docs

- For each task, read [GOAL.md](./GOAL.md) first only if the task direction is unclear.
- Then read exactly one or two task-specific docs from this index.
- Do not load every document by default.
- If a term changes meaning, update [../CONTEXT.md](../CONTEXT.md) immediately.
- If a goal changes, update [GOAL.md](./GOAL.md) in the same small step.
- If implementation changes reveal a mismatch with these docs, update the relevant doc before moving to the next feature.

## Current Next Discussion

After this README, the next product discussion is the first user-facing questionnaire details. The current draft is in [CHARACTER_QUESTIONS.md](./CHARACTER_QUESTIONS.md), but implementation should wait until the question set is confirmed.
