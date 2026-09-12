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
Short text supplied by the player or read from visible text in the Source Photo, used to influence names, traits, or motifs.
_Avoid_: OCR truth, legal name

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
