# Photo Character Lab

This context describes the game domain for turning a consent-based real photo and player answers into a fictional battle-card character.

## Language

**Source Photo**:
A player-provided real photo used as creative material for a fictional character. It is not a proof of identity and should not imply that the system recognizes who the person is.
_Avoid_: Identity photo, face recognition input

**Photo Signal**:
Non-identifying visual information extracted from a Source Photo, such as color, contrast, composition, line density, or text-like marks. It is a creative signal for generation, not a biometric claim.
_Avoid_: Face data, identity data

**Text Seed**:
Short text supplied by the player or read from visible text in the Source Photo, such as jersey text, signs, labels, or symbols. It is used to influence names, traits, or motifs.
_Avoid_: OCR truth, legal name

**Visible Semantic Tag**:
A visible, non-sensitive scene or action clue suggested from the Source Photo, such as basketball court, athlete, arcade room, formal outfit, sweaty, tired, celebratory, or holding a controller. It is not OCR text.
_Avoid_: Text Seed, inferred personal fact, hidden profile

**Visible Person Description**:
A visible, non-sensitive description of the person in the Source Photo, such as hair shape, expression cue, pose, accessory, outfit silhouette, or face visibility. It supports creative likeness and character design without identifying the person or inferring protected traits.
_Avoid_: Identity recognition, detected age, detected gender, ethnicity, sexuality, health, political belief, personality truth

**Target Subject**:
The single person or object in the Source Photo that should become the Battle Card character. In the current MVP, this defaults to the centered, largest, or clearest foreground subject. Other visible people remain part of the scene context but must not contribute personal appearance details to the character.
_Avoid_: All detected people, face identity, crowd-as-character

**World Context**:
Visible background and environmental signals around the Target Subject, such as place, props, lighting, crowd presence, signs, and activity. It can influence card art atmosphere and mechanics without changing who the character is.
_Avoid_: Background person identity, unrelated subject traits

**Generation Profile**:
The player's answers that steer character creation, including age impression, real-world role, visible traits, combat style, and card mood.
_Avoid_: User profile, personal profile

**User-Supplied Context**:
Optional context intentionally provided by the player or photo subject to shape a fictional character, such as backstory, preferences, values, identity, or roleplay direction.
_Avoid_: Detected identity, inferred profile

**Sensitive Creative Context**:
Sensitive User-Supplied Context, such as sexual orientation, political views, religion, health, or similar personal information. It may only be used when explicitly provided by the subject or with clear consent, and must never be inferred from a Source Photo.
_Avoid_: Inferred sexuality, inferred politics, biometric profile

**Capture Context**:
Optional time, location, weather, or place-type information attached to a capture. It is a creative seed for the character's origin, visuals, or mechanics, not required identity data.
_Avoid_: Tracking data, exact location requirement

**Default Generation Template**:
A fallback creative context used when optional User-Supplied Context or Capture Context is missing.
_Avoid_: Missing data error

**User-Declared Field**:
A character input that only counts when the player or photo subject explicitly provides it.
_Avoid_: Model-inferred personal fact

**Model-Suggested Field**:
A non-sensitive creative suggestion produced from Photo Signal, OCR, or visible scene context. It must be editable or confirmable by the player before it becomes authoritative.
_Avoid_: Detected truth, hidden inference

**Rule-Derived Field**:
A game-facing result produced by deterministic project rules from allowed inputs, such as stats, skills, traits, element bias, or growth hooks.
_Avoid_: AI-decided stat, arbitrary output

**Generation Guardrail**:
A rule that constrains what models may infer, generate, store, or influence during character creation.
_Avoid_: Prompt suggestion only

**Question Mapping**:
The documented link from a questionnaire answer to its allowed data source, Character Spec field, card art prompt hook, stat or skill rule hook, and player-facing explanation.
_Avoid_: Free-form prompt instruction

**System Pipeline**:
The ordered product flow that turns consent-based Source Photo input and allowed player context into a Character Spec, Card Cover, Battle Card, progression state, and battle result.
_Avoid_: Single AI chain, prompt pipeline

**Age Impression**:
A fictional age band selected as creative direction for the character. It is not a verified age estimate.
_Avoid_: Detected age, real age

**Real-World Role**:
A player-declared job, identity, hobby, or social role that can become a character motif.
_Avoid_: Character class, profession record

**Visible Trait**:
A player-declared visual or personality cue that should affect the generated character.
_Avoid_: Biometric trait, diagnosis

**Combat Style**:
The preferred battle behavior chosen by the player, such as striker, duelist, guardian, controller, or trickster.
_Avoid_: Personality type

**Card Mood**:
The visual and tonal direction for the card art.
_Avoid_: Genre, faction

**Character Spec**:
The canonical fictional character definition produced from Photo Signal and Generation Profile. It contains the game-facing identity of the character, independent from any particular image file.
_Avoid_: Card image, raw prompt

**Archetype**:
A broad fantasy role that gives the character an element, motif, and stat bias.
_Avoid_: Job, occupation

**Element**:
The character's fantasy energy family, used for flavor, visuals, and future combat relationships.
_Avoid_: Color only

**Rarity**:
A game tier that expresses how special a generated character is and can grant stat budget or presentation weight.
_Avoid_: Quality score

**Stat**:
A numeric battle attribute on a character, such as power, speed, guard, focus, or luck.
_Avoid_: Metric, score

**Card Stat Line**:
The visible combat numbers printed on a Battle Card, such as HP, ATK, DEF, COST, level, and later any game-specific battle values. It is derived from Character Spec and progression through project rules, not freely assigned by an AI model.
_Avoid_: AI score, person rating, visual quality score

**Trait**:
A short descriptive tag that summarizes visual, narrative, or tactical identity.
_Avoid_: Keyword, label

**Skill**:
A usable battle move derived from the Character Spec.
_Avoid_: Trait, passive label

**Combat Role**:
The character's tactical job in battle, derived from stats, archetype, and Combat Style.
_Avoid_: Real-world role

**Retouched Portrait**:
An identity-preserving fantasy portrait derived from the Source Photo for creative use in the card.
_Avoid_: Verified likeness, face match

**Identity Preservation**:
The visual goal of keeping broad likeness and recognizable cues of the consenting photo subject while transforming them into a fictional character.
_Avoid_: Face recognition, identity verification

**Character Form Branch**:
The chosen visual transformation route for a generated character, such as humanlike, animalized, or objectified. It decides how Source Photo cues are transferred into the generated character before style and card UI are applied.
_Avoid_: Git branch, random prompt style, model name

**Humanlike Branch**:
A Character Form Branch where the Target Subject remains a human or humanlike character. It prioritizes facial likeness, source body proportion, plausible anatomy, and visible personal cues.
_Avoid_: Photo retouch only, exact identity copy

**Animalized Branch**:
A Character Form Branch where the Target Subject becomes an animal protagonist, such as a cat or dog. Likeness is transferred through visible cues, accessories, expression character, color, clothing motifs, props, and attitude rather than direct human facial similarity.
_Avoid_: Human with animal ears, random pet, face swap

**Objectified Branch**:
A Character Form Branch where the Target Subject becomes a non-living character, artifact, robot, mascot object, weapon, relic, vehicle, or animated item. Likeness is transferred through motifs, silhouette cues, palette, accessories, symbols, props, and personality cues rather than human anatomy.
_Avoid_: Random object, product mockup, loss of source-photo cues

**Card Cover**:
The final visual presentation image for a Battle Card.
_Avoid_: Character Spec

**Battle Card**:
A playable saved character card that combines a Character Spec, progression state, and visual presentation.
_Avoid_: Source Photo, generated image only

**Character Library**:
The player's collection of saved Battle Cards.
_Avoid_: Deck, account

**Battle Test**:
A lightweight combat simulation used to validate whether a Battle Card feels usable and distinct.
_Avoid_: Ranked match, multiplayer battle
