# Pose Reference Selection

This document defines how pose references enter the card-art prompt pipeline.

比喻：Reference pose pack 像一疊「動作分鏡卡」。AI 是讀圖助手和畫師，但不能自己翻整疊卡亂挑。系統先把原圖轉成可見姿勢線索，再由規則層從 catalog 選出可控姿勢。

## Current Decision

Selected option:

```text
Rules-first pose selection + AI-assisted source-pose cue reading
```

Meaning:

- VLM/AI may describe visible pose cues from the source photo, such as standing, running, hands visible, stable, playful, or centered.
- The project rule layer chooses the final pose from `POSE_REFERENCE_LIBRARY`.
- The player does not choose the pose in v1; the selected character setting and rules choose it.
- The image provider receives one selected pose cue, not permission to freely choose any pose.
- Body profile is chosen from character settings or character form branch only. It must not be inferred from source-photo gender.

Implemented in:

```text
src/card-generation/pose-reference.js
tools/pose-reference-smoke.mjs
src/progression/evolution-art.js
```

## Catalog Shape

The current catalog is text-only until neutral mannequin/skeleton pose guides are produced.

```text
4 body profiles:
  neutral_human
  masculine_human
  feminine_human
  mascot_nonhuman

8 occupation groups:
  tech_research
  medical_support
  education
  creative
  athlete
  frontline
  commander
  general

8-9 pose candidates per body profile + occupation group
```

Current generated size:

```text
260 text-only pose candidates
```

Each selected pose stores:

- `poseId`
- `poseFamily`
- `poseStage`
- `bodyProfile`
- `occupationGroup`
- `promptCue`
- `upgradeCue`
- `topCandidates`
- `poseProgressionPlan`
- safety policies

This satisfies the requirement that the same profession has multiple candidates, currently 8 to 10 per body profile and occupation group.

## Body Profile Rule

Body profile is not a sensitive-trait detector.

Allowed sources:

- explicit character setting, such as `poseBodyProfile` or `bodyProfile`
- character form branch, such as `animalized.cat` -> `mascot_nonhuman`
- safe default -> `neutral_human`

Disallowed sources:

- source-photo gender inference
- chest/waist/hip/shoulder shape inference
- player-facing gender selection in the current flow

Prompt safety line:

```text
Do not infer or change gender from the source photo.
```

## RazielNozac Source Assets

The project downloaded RazielNozac's `Editable Reference Poses Pack`:

```text
https://razielnozac.itch.io/reference-poses
```

Local reference files:

```text
godot/art/source/pose-catalog/power_charge_front_01.png
godot/art/source/pose-catalog/speed_lunge_diagonal_01.png
godot/art/source/pose-catalog/guard_ready_front_01.png
godot/art/source/pose-catalog/caster_focus_three_quarter_01.png
godot/art/source/pose-catalog/playful_tilt_mascot_01.png
godot/art/source/pose-catalog/neutral_hero_center_01.png
```

Use policy:

```text
source_asset_requires_anatomy_neutralization
do_not_send_as_image_input
```

Reason: several source pose PNGs have visibly sex-coded body proportions. Until they are redrawn as neutral mannequin/skeleton guides, the image provider gets only selected pose ids and text cues.

## Pipeline

```text
Source Photo
  -> Photo Analysis / VLM visible pose cues
  -> Pose Intent
  -> Body profile from Character Setting / Form Branch
  -> Occupation Group from Character Setting
  -> Evolution Stage from progression tier
  -> Deterministic Catalog Scoring
  -> Selected Pose Reference
  -> Prompt Profile / Evolution Prompt Profile
  -> Card Art Provider
```

Allowed source signals:

- visible pose cue: standing, leaning, seated, hand raised, crossed arms, running, action stance
- activity cue: sports, dancing, arcade, walking, working, performing, holding object
- expression cue: calm, intense, playful, focused
- composition cue: full body, upper body, centered subject, side angle, group crop
- visible semantic tags already allowed by the project
- generation profile: combat style, card mood, character form branch, occupation
- internal stats only as style hints, such as high speed preferring agile poses

Disallowed source signals:

- identity recognition
- real age, gender, ethnicity, sexuality, politics, religion, health, wealth, or sensitive inference
- using pose choice to create battle numbers directly

## Evolution Rule

Evolution tier maps to pose stage:

```text
0-1 -> base
2   -> evolved
3   -> advanced
4   -> awakened
5   -> final
```

When an Evolution Art Job is built, `src/progression/evolution-art.js` now reruns pose selection with the target `evolutionTier`. This gives upgraded card art a stronger pose cue while preserving:

- source-photo identity hooks
- character form branch
- selected/safe body profile
- occupation group
- no-gender-inference rule

## Prompt Integration

Provider prompt block:

```text
POSE REFERENCE:
- Selected pose id: neutral_human_athlete_quick_feint.
- Body profile: Neutral Human. Chosen from character settings only, not from photo gender inference.
- Profession pose group: Athlete / Performer.
- Evolution pose stage: base; cue: ...
- Upgrade cue: ...
- Other valid candidate ids considered: ...
- Use the selected pose only for body/action silhouette and camera rhythm.
- Do not copy chest, waist, hip, shoulder, or other sex-coded anatomy from the pose reference.
- Do not infer or change gender from the source photo.
```

## Next Asset Step

To move from text-only to image-guided pose control:

1. Redraw or generate neutral mannequin/skeleton versions of the selected source pose families.
2. Keep one consistent body profile library per supported body profile, or use neutral skeletons only.
3. Validate with contact sheets and provider tests that pose is followed without leaking pixel-art style or sex-coded anatomy.
4. Only then change `imageInputPolicy` from text-only to selected neutral pose-image input.
