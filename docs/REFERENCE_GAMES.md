# Reference Games

This document collects games with useful creative patterns for the photo-to-card concept. These are references for mechanics and interaction ideas, not assets to copy.

## Photo Dojo

Source:

- https://www.nintendo.com/en-gb/Games/Nintendo-DSiWare/Photo-Dojo--264644.html

Relevant idea:

- Uses camera photos and recorded sounds to create a personalized fighting game character.
- The player becomes part of the action through captured poses, voice, and background.

What to learn:

- User capture can become a playable character quickly.
- The creation flow should be simple and playful.
- Photos can affect both appearance and move identity.

How it maps to this project:

```text
photo + user-provided details
  -> playable character
  -> fight with that character
```

## Face Raiders

Source:

- https://en-americas-support.nintendo.com/app/answers/detail/a_id/634/p/605/c/183

Relevant idea:

- Uses photos of yourself, friends, or family as game targets.
- Stores a face collection that players can view, edit, or delete.

What to learn:

- Real photos create immediate emotional impact.
- Delete/edit controls matter when real people's images are used.

How it maps to this project:

- Use real photos only with consent.
- Give players control over saved generated cards and source material.
- Avoid turning people into targets without consent.

## Monster Rancher

Sources:

- https://www.koeitecmoeurope.com/manual/mrdx/mf1/en/2100.html
- https://www.nintendo.com/es-mx/store/products/monster-rancher-1-and-2-dx-switch/

Relevant idea:

- Real-world media data becomes a game creature.
- The generated creature is then trained, combined, and used in battle.

What to learn:

- External real-world input can act as a seed for unique game entities.
- The generated entity becomes more meaningful after training and battles.

How it maps to this project:

```text
photo seed
  -> unique Battle Card
  -> training / progression
  -> battle
```

## Pokemon GO

Sources:

- https://niantic.helpshift.com/hc/zh-hant/6-pokemon-go/faq/53-what-are-weather-boosts/
- https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/28-catching-pokemon-in-ar-mode-1712012768/

Relevant idea:

- Real-world context can change game outcomes.
- Weather can affect type appearance and battle move strength.
- AR uses the real environment as part of play.

What to learn:

- Capture Context such as time, weather, and place type can add flavor and mechanics.
- Location-like data should be optional and handled carefully.

How it maps to this project:

```text
capture time / location type / weather
  -> element bias
  -> card origin
  -> skill flavor
  -> optional battle modifier
```

## Pikmin Bloom

Sources:

- https://pikminbloom.com/en/gameplay
- https://www.nintendo.com/us/whatsnew/mobilenews-grow-and-thrive-with-pikmin-bloom-available-now-for-ios-and-android/

Relevant idea:

- Walking becomes growth.
- Places and memories become part of a creature's identity.
- Daily activity creates progression.

What to learn:

- Raising a character can connect to light real-world activity.
- Progression should feel like a memory trail, not just a number grind.

How it maps to this project:

```text
walk / talk / daily memory
  -> XP
  -> trait growth
  -> evolved card presentation
```

## Design Takeaways

- Real-world input is strongest when it becomes a playable rule, not only a cosmetic skin.
- Capture Context should be coarse and optional by default.
- Sensitive context must be provided explicitly and never inferred.
- Generated cards need edit/delete controls because they are tied to real people.
- The first version should keep the loop small: generate, save, train lightly, battle.
