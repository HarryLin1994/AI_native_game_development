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

**Location Reference**:
An optional, consent-based reference to where a Source Photo was captured, such as a coarse place type, neighborhood, Google Maps place reference, or exact coordinates when explicitly allowed. It should be transformed into creative Location Context before image generation.
_Avoid_: Required GPS tracking, hidden location inference

**Context Acquisition Method**:
The documented way a context value enters the system, such as browser GPS permission, photo EXIF GPS, Google reverse geocoding, Google Places lookup, manual input, or a public holiday adapter. It describes provenance and allowed use, not a promise that every source is active in the current MVP.
_Avoid_: Hidden tracking, automatic inference

**Automatic Context Acquisition**:
Consent-based collection of non-questionnaire context, such as capture time, EXIF GPS, browser GPS, address, Google Maps place reference, season, and public holiday context. It supplies creative context and may feed deterministic Rule Tables, but must not replace user choices or user-provided sensitive context.
_Avoid_: Questionnaire replacement, hidden profiling

**Location Creative Tag**:
A model-safe location motif derived from a Location Reference or place type, such as neon indoor venue, coastal public space, campus atmosphere, or station transfer flow. It can affect rules or prompts without exposing exact GPS, address, or raw Google Maps data.
_Avoid_: Exact address, map URL, raw coordinate

**Event Context**:
Optional public time-based context such as season, holiday, festival, local event, or notable date connected to the generation moment. In the current MVP, public holiday context is US-only and uses the real-world current date, not old photo EXIF dates. It is a creative and mechanical source only after being normalized through Rule Tables, and must not infer sensitive beliefs or political alignment.
_Avoid_: Political profiling, religious inference, news truth

**Event Creative Tag**:
A model-safe event or season motif derived from Event Context, such as autumn palette, summer brightness, new year countdown glow, or year-end celebration energy. It should be reviewable and non-sensitive.
_Avoid_: Unconfirmed news event, sensitive event inference

**Event Combat Profile**:
A Rule-Derived Field created from Event Context that can affect card art motifs, stat modifiers, traits, archetype bias, skill words, and lore. It is deterministic game design data, not an AI judgment about the person.
_Avoid_: AI-decided event power, sensitive event inference

**Vision Context**:
The structured result of VLM/OCR/photo analysis, including Target Subject cues, World Context, Text Seed, Visible Semantic Tags, palette, lighting, and composition. It is model-suggested and should be reviewable.
_Avoid_: Identity recognition, hidden personal profile

**VLM Creative Roll**:
A non-sensitive set of roleplay candidates generated from Vision Context, Capture Context, and Event Context to add game variation before the player chooses a character direction. It is a creative roll, not a factual judgment about the photographed person.
_Avoid_: Personal inference, AI-decided truth, final stat roll

**Candidate Choice**:
A player-selected option from a VLM Creative Roll that becomes part of the Character Spec. Unselected candidates have no mechanical effect.
_Avoid_: Hidden model decision, discarded suggestion

**Character Name Seed**:
A short player-entered name used as the required name core for the generated Battle Card title. If omitted, it defaults to `路人`.
_Avoid_: Legal name, identity verification

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

**Rule Table**:
A controlled set of game design data that maps allowed inputs to deterministic modifiers, labels, traits, archetype bias, or skill words. It can change game balance, but it does not run model inference.
_Avoid_: AI prompt, hidden model weight

**Generation Guardrail**:
A rule that constrains what models may infer, generate, store, or influence during character creation.
_Avoid_: Prompt suggestion only

**Question Mapping**:
The documented link from a questionnaire answer to its allowed data source, Character Spec field, card art prompt hook, stat or skill rule hook, and player-facing explanation.
_Avoid_: Free-form prompt instruction

**Questionnaire Schema**:
The controlled product definition of which setup fields are created by VLM Creative Roll, Candidate Choice, user declaration, defaults, or rules, including Character Spec mapping, prompt hooks, and game-rule effects.
_Avoid_: UI mockup, unbounded survey, model-generated questionnaire

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

**Combat Core**:
The player-facing high-level battle identity of a Battle Card. In v1, the confirmed cores are `攻擊型`, `防禦型`, and `支援型`. It tells the player the card's broad tactical direction before reading individual skills.
_Avoid_: Character class, hidden AI personality, detailed skill list

**Combat Variant**:
A finer tactical flavor inside a Combat Core, used to make generated skills feel different while keeping the player-facing category simple. A variant should not replace the Combat Core on the main card identity.
_Avoid_: Separate core, random skill text, player-facing required choice

**Card Mood**:
The visual and tonal direction for the card art.
_Avoid_: Genre, faction

**Character Spec**:
The canonical fictional character definition produced from Photo Signal and Generation Profile. It contains the game-facing identity of the character, independent from any particular image file.
_Avoid_: Card image, raw prompt

**Prompt Hook**:
A controlled field from Character Spec that is allowed to influence image generation, such as identity cues, outfit motifs, event motifs, place atmosphere, or avoid rules.
_Avoid_: Free-form unreviewed prompt text, hidden stat rule

**Prompt Profile**:
The structured set of Prompt Hooks passed to a Card Art Provider. It is the safe prompt-facing view of Character Spec and excludes raw precise location, raw maps URLs, and unapproved sensitive context.
_Avoid_: Raw Character Spec dump, provider-specific prompt only

**Card Generation Mechanism**:
The deterministic game-rule process that turns Photo Signal, confirmed semantic tags, Generation Profile, and a reroll seed into a Character Spec, Card Stat Line, traits, skills, and card-art prompt hooks.
_Avoid_: Image generation model, battle simulator

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
The visible combat numbers printed on a Battle Card, such as HP, ATK, DEF, AGI, COST, and level. It is derived from Character Spec and progression through project rules, not freely assigned by an AI model. In v1, AGI is derived from internal speed plus rarity and level bonuses.
_Avoid_: AI score, person rating, visual quality score

**Trait**:
A short descriptive tag that summarizes visual, narrative, or tactical identity.
_Avoid_: Keyword, label

**Skill**:
A usable battle move derived from the Character Spec.
_Avoid_: Trait, passive label

**Skill Kit**:
The complete battle ability package on a Battle Card. In v1, the confirmed structure is two Active Skills, two Battle Traits, and one Ultimate Skill. Every entry must be traceable to Character Spec inputs.
_Avoid_: Random move list, AI-only skill text, unrelated ability bundle

**Active Skill**:
A player- or system-triggered battle move that can be used during a turn, usually with a cooldown, cost, or timing rule.
_Avoid_: Passive trait, always-on stat bonus

**Battle Trait**:
A passive, automatic, or conditional battle behavior that expresses the character's identity during combat without requiring direct skill selection every time.
_Avoid_: Flavor tag, UI label only, active skill

**Ultimate Skill**:
A high-impact signature move that represents the strongest expression of the character's identity. It should require a charge, condition, or meaningful battle timing so it does not play like a normal Active Skill.
_Avoid_: Third active skill, free extra damage, unrelated finisher

**Ultimate Charge**:
A battle resource accumulated through actions such as attacking, taking damage, triggering Battle Traits, or using identity-linked skills. It is one requirement for using an Ultimate Skill.
_Avoid_: Mana, cooldown only, always-ready button

**Ultimate Condition**:
A character-specific battle condition that must be true before an Ultimate Skill can be used, in addition to having enough Ultimate Charge. It should come from the character's Combat Core, Combat Variant, weakness, story event, visible tags, or other Character Spec inputs.
_Avoid_: Generic unlock, random restriction, unrelated puzzle condition

**Skill Identity Hook**:
The documented reason a skill belongs to a specific generated character, such as a Source Photo cue, Visible Semantic Tag, user choice, Capture Context, Event Context, Character Name Seed, or signature item.
_Avoid_: Generic skill theme, untraceable prompt phrase

**Skill Material Profile**:
The normalized creative material allowed to influence Skill Kit generation, including visible tags, scene motifs, props, action cues, mood cues, signature items, event motifs, and safe naming fragments. It may include VLM suggestions, but it is not executable battle logic.
_Avoid_: Final skill rules, raw VLM output, AI stat decision

**Skill Naming Candidate**:
A VLM- or rule-suggested phrase that may influence a skill name or display text after normalization. It must not define battle effects, numbers, targets, costs, or cooldowns.
_Avoid_: Skill Effect Spec, final ability, unreviewed prompt text

**Skill Effect Spec**:
The executable data representation of a Skill, Battle Trait, or Ultimate Skill. It describes allowed operations, targets, scaling, timing, and conditions so battle logic can run the skill without custom code per card.
_Avoid_: Skill flavor text, prompt-only effect, per-card function

**Skill Effect Interpreter**:
The battle module that validates and resolves Skill Effect Specs against the current battle state. It is the only place where skill operations should mutate battle state.
_Avoid_: One-off skill handler, AI-decided effect runner, UI animation code

**Progression State**:
The saved growth data for a Battle Card, including level, XP, stat growth, skill ranks, chosen skill branches, visual evolution tier, and battle record. It is saved as plain versioned data and recalculates derived values through rules.
_Avoid_: Raw UI state, unsaved temporary battle state, AI-generated growth result

**Level Cap**:
The maximum level a Battle Card can reach. The confirmed v1 Level Cap is 100.
_Avoid_: Open-ended level, uncapped growth

**Evolution Milestone**:
A fixed level threshold that triggers major progression work, such as a blocking Skill Branch choice and Visual Evolution image generation. Confirmed v1 milestones are Lv.16, Lv.36, Lv.70, and Lv.100.
_Avoid_: Every-level visual change, hidden random evolution

**Skill Rank**:
The upgrade level of one Skill Kit entry. It can change effect strength, cooldown, charge gain, trigger threshold, or display text through deterministic rules.
_Avoid_: Player level, free-form skill rewrite

**Skill Branch**:
A chosen upgrade route for a Skill Kit entry, such as burst versus combo, shield versus counter, or heal versus buff. It changes the skill's future progression while preserving its identity hooks.
_Avoid_: Random replacement skill, unrelated new move

**Skill Branch Option Source**:
The rule-trace category that explains why a Skill Branch option exists. In v1, every branch choice presents exactly one `combatVariant` option and one `characterHook` option.
_Avoid_: Hidden random source, image-model decision, Git branch source

**Pending Branch Choice**:
A blocking progression decision created when a Battle Card unlocks a Skill Branch. The player must choose a branch before the card can complete the level-up/evolution transaction.
_Avoid_: Auto-selected branch, hidden random branch, optional notification only

**Visual Evolution**:
The generated-art growth state of a Battle Card. It includes an evolution prompt profile, provider job, generated evolved card art, frame/aura/badge metadata, and acceptance status. It reflects progression but does not decide battle effects.
_Avoid_: Stat source, image provider deciding rules, UI-only badge

**Evolution Art Job**:
A tracked image-generation job created when Visual Evolution requires new card art. It records provider, input art/source refs, prompt hooks, status, result asset, retry state, and failure reason.
_Avoid_: Invisible provider call, local UI fallback, untracked image attempt

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

**Card Art Provider**:
A replaceable image-generation adapter that turns a Source Photo and card-art prompt into character art, such as Gemini, OpenAI, ComfyUI, or Canvas fallback. It does not decide stats, skills, rarity, or battle rules.
_Avoid_: Card Generation Mechanism, battle rules engine

**Battle Card**:
A playable saved character card that combines a Character Spec, progression state, and visual presentation.
_Avoid_: Source Photo, generated image only

**Character Library**:
The player's collection of saved Battle Cards.
_Avoid_: Deck, account

**Battle Test**:
A lightweight combat simulation used to validate whether a Battle Card feels usable and distinct.
_Avoid_: Ranked match, multiplayer battle
