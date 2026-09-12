# UI Reference

This document captures the current UI direction from the provided reference images and the desired Hearthstone-like card feel.

The reference images are for visual study only. They should not be copied as shipped assets.

## Direction

The desired UI is closer to a mobile gacha RPG character-card interface than a minimal tabletop card game.

Core qualities:

- High information density.
- Large character art.
- Strong rarity presentation.
- Clear HP / ATK / DEF / COST values.
- Bright energy effects.
- Physical-feeling card movement in battle.

比喻：畫面不是一張乾淨名片，而像遊戲機台上的角色面板，資訊很多，但玩家一眼知道哪裡看等級、哪裡看攻擊力。

## Reference: Character Library

Reference image:

- `/Users/harrylin/Downloads/what-are-some-of-the-rarest-cards-you-have-v0-3kvninhgqiz31.jpg.webp`

Useful patterns:

- Two-column character list.
- Each row shows a small portrait plus battle stats.
- Rarity is large and visually loud.
- Attribute/type badge is near the portrait.
- Level and cost are immediately visible.
- Team cost appears at the top as a collection constraint.

Possible adaptation:

```text
Character Library
  -> selected team / saved cards
  -> each Battle Card row:
       portrait
       rarity
       element
       level
       HP / ATK / DEF
       cost
```

MVP UI target:

- Replace current simple local character list with denser battle-card rows.
- Keep click/tap selection.
- Do not add real deck-cost rules until card balance is clearer.

## Reference: Character Details

Reference image:

- `/Users/harrylin/Downloads/5d84582338827b247e016ec8aa.png.jpeg`

Useful patterns:

- Large vertical character art dominates the screen.
- Rarity, attribute, and star-like status are oversized.
- HP / ATK / DEF are presented as big bottom stats.
- Level progress is visually important.
- Skill text is below the main art.
- Main action button is large and bright.

Possible adaptation:

```text
Character Detail
  -> generated card art as hero visual
  -> rarity + element + archetype
  -> HP / ATK / DEF / extra stats
  -> level and XP bar
  -> skills
  -> train / battle / regenerate cover actions
```

MVP UI target:

- Make the generated art feel central.
- Move stats from small rows into stronger battle-card stat blocks.
- Keep skill descriptions readable.

## Hearthstone-Like Battle Feel

The desired interaction is not just static UI. Cards should feel like physical objects.

Patterns to study:

- Cards fan or stack in a hand area.
- Hover or tap lifts and enlarges a card.
- Dragging a card gives shadow, tilt, and movement inertia.
- Valid targets glow.
- Invalid release snaps the card back.
- Played card moves along a visible path.
- Attack or skill creates impact flash, screen shake, and damage numbers.
- End of action returns control clearly to the player.

比喻：普通網頁按鈕像按電梯；Hearthstone 式卡牌像真的拿起一張牌丟到桌上。

## Screen Targets

### Generator Screen

Purpose:

- Take Source Photo and Generation Profile.
- Produce Character Spec and card art.

Key UI:

- Photo input.
- Character questions.
- Generation status.
- Generated card preview.
- Save to Character Library.

### Character Library Screen

Purpose:

- Browse saved Battle Cards.
- Pick who to train or battle with.

Key UI:

- Dense card rows.
- Filters later: rarity, element, level.
- Selected card detail preview.

### Character Detail Screen

Purpose:

- Inspect one Battle Card.
- See art, stats, skills, level, XP, and progression actions.

Key UI:

- Large card art.
- Strong stat panel.
- Skills panel.
- Train, talk, battle actions.

### Battle Screen

Purpose:

- Let a trained Battle Card fight a CPU opponent.

Key UI:

- Player character area.
- Enemy character area.
- Skill cards or action buttons.
- HP bars.
- Battle log can exist in MVP, but should eventually become visual feedback.

## Visual Language

Use:

- layered metallic or glassy panels
- saturated accent colors
- thick stat labels
- rarity badges
- element icons or chips
- diagonal energy shapes
- bright attack flashes
- strong contrast between art and stat UI

Avoid:

- plain dashboard cards
- low-contrast small text
- purely decorative clutter that hides stats
- copying exact layouts, logos, characters, fonts, or labels from reference games

## Implementation Notes

- UI should be responsive, but first target can be desktop browser plus phone-like vertical preview.
- Use stable layout containers so stats and buttons do not overlap.
- Make game state drive UI updates through events where possible.
- Treat card movement as a separate interaction layer later, not mixed into generation logic.

## Next UI Step

The first UI implementation step should be small:

1. Create a denser Battle Card detail layout.
2. Keep existing data and battle logic.
3. Do not add drag-and-drop yet.
4. Use the generated card art as the main visual.

After that, add Hearthstone-like motion in a separate pass.
