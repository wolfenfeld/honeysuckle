# Gemini prompt: cat sticker cards

## הוראות קצרות (עברית)
1. פותחים שיחה חדשה ב-Gemini (מומלץ מודל עם יצירת תמונות, למשל Nano Banana).
2. מדביקים קודם את **הפרומפט הראשי** (בלוק ה-STYLE למטה) ומחכים ל"ready".
3. אחרי זה מדביקים בקשה אחת בכל פעם מהרשימה, וכל בקשה מחזירה קלף אחד. אותה שיחה שומרת על סגנון אחיד.
4. שומרים כל תמונה בשם המספר שלה: `01.png`, `02.png` ... `30.png` (יחס 3:4), ושמים בתיקייה `honeysuckle/cards/`.
5. לא חייבים את כל ה-30 מיד. קלף שאין לו תמונה מוצג כרגע עם איור זמני, ומתחלף אוטומטית כשהקובץ מופיע.
6. אם תמונה יצאה עם טקסט או מסגרת, מבקשים: "Regenerate without any text or border, same style."

## פרומפט ראשי (להדביק ראשון)

```
Create a collectible CAT STICKER CARD set for a children's learning game (kids aged 8-10). I will ask for the cards one at a time. Keep ONE consistent look across all cards:

STYLE
- Cute, friendly digital storybook illustration, soft rounded shapes, clean thick-ish outlines, bright warm saturated colors, gentle shading, big expressive eyes. Looks like a premium kids' sticker / trading card, not photorealistic and not scary.
- The same art style, same line weight, same face style and same lighting on every card.

FORMAT (very important)
- Vertical portrait, aspect ratio 3:4 (for example 1024 x 1365 px).
- Full-bleed illustration that fills the whole image. No border, no frame, no card outline, no rounded corners (my app adds the frame).
- NO text of any kind: no letters, no numbers, no logos, no watermarks, no speech bubbles.
- Composition: the cat is the clear hero, centered, filling about the upper 75% of the image. Keep the bottom 20% a calm, simple part of the background (no important details there) because a name plate will be placed over it.
- One cat per card (plus its props/scene). Kid-safe content only.

RARITY LOOK (the more cats in the rarity, the more special the card feels)
- Rarity 1 (common): simple scene, flat pastel background, one cat.
- Rarity 2 (uncommon): a fun costume or prop and a slightly richer background.
- Rarity 3 (rare): a themed character with a detailed background and nice lighting.
- Rarity 4 (epic): magical or adventurous, glowing light, sparkles, dramatic colors.
- Rarity 5 (legendary): breathtaking, glowing aura, shimmering particles, rich gradients, the most detailed illustration of the set.

Reply "ready" if you understand. Then I will send card requests like: "Card 07 - Snooze (rarity 1): ...". Generate exactly one image per request in this style.
```

## 30 הבקשות (מדביקים אחת בכל פעם)

| # | Name (HE) | Name (EN) | Rarity | Card request to paste |
|---|---|---|---|---|
| 01 | גינג'ר | Ginger | 🐱 | Card 01 - Ginger (rarity 1): a plump orange tabby cat sitting calmly, soft pastel yellow background. |
| 02 | לילה | Midnight | 🐱 | Card 02 - Midnight (rarity 1): a sleek black cat with big green eyes sitting under a crescent moon, deep blue background. |
| 03 | שלגיה | Snowball | 🐱 | Card 03 - Snowball (rarity 1): a fluffy white cat with blue eyes, light sky-blue background with a few snowflakes. |
| 04 | עננית | Misty | 🐱 | Card 04 - Misty (rarity 1): a soft gray cat sitting among small fluffy clouds, pale lavender background. |
| 05 | טלאית | Patches | 🐱 | Card 05 - Patches (rarity 1): a calico cat with orange, black and white patches, mint green background. |
| 06 | צמרמר | Yarn | 🐱 | Card 06 - Yarn (rarity 1): a playful kitten tangled in a big ball of red yarn, warm peach background. |
| 07 | נמנום | Snooze | 🐱 | Card 07 - Snooze (rarity 1): a sleepy kitten curled up in a woven basket with little floating 'z' bubbles (no letters, use round bubbles only), cozy beige background. |
| 08 | פסי | Stripes | 🐱 | Card 08 - Stripes (rarity 1): a gray tiger-striped cat walking with its tail held high, light green background. |
| 09 | גרבי | Socks | 🐱 | Card 09 - Socks (rarity 1): a black cat with four bright white paws that look like socks, soft pink background. |
| 10 | קרטון | Boxy | 🐱 | Card 10 - Boxy (rarity 1): a cat squeezed happily into a box that is too small for it, light brown background. |
| 11 | חופית | Sandy | 🐱🐱 | Card 11 - Sandy (rarity 2): a cat wearing a straw sun hat on a sunny beach with a small bucket and shell, turquoise sea behind. |
| 12 | טיפה | Drizzle | 🐱🐱 | Card 12 - Drizzle (rarity 2): a cat in a yellow raincoat holding a small umbrella, jumping in puddles, rainy day with a tiny rainbow. |
| 13 | עוגיה | Cookie | 🐱🐱 | Card 13 - Cookie (rarity 2): a baker cat in a chef hat holding a tray of cookies, warm kitchen background. |
| 14 | מקצב | Beats | 🐱🐱 | Card 14 - Beats (rarity 2): a cat wearing big headphones, bobbing to music, floating colorful music notes, purple background. |
| 15 | פרחונת | Blossom | 🐱🐱 | Card 15 - Blossom (rarity 2): a cat with a flower crown sitting in a blooming garden, butterflies around. |
| 16 | צלמית | Snap | 🐱🐱 | Card 16 - Snap (rarity 2): a cat holding a vintage camera with a big lens, sunny park background. |
| 17 | גלגלית | Wheelie | 🐱🐱 | Card 17 - Wheelie (rarity 2): a cool cat riding a skateboard wearing a helmet, bright urban background with sparkles of motion. |
| 18 | קפואית | Frosty | 🐱🐱 | Card 18 - Frosty (rarity 2): a cat in a knitted red scarf and hat in a snowy forest, gentle snowfall. |
| 19 | ספרנית | Bookworm | 🐱🐱🐱 | Card 19 - Bookworm (rarity 3): a cat librarian with round glasses sitting on a stack of books in a cozy old library, warm wooden shelves and golden light. |
| 20 | חשבונית | Professor Purr | 🐱🐱🐱 | Card 20 - Professor Purr (rarity 3): a cat mathematician with a pencil behind its ear next to a blackboard covered with chalk drawings of shapes and dots (no readable numbers or letters). |
| 21 | ספרינטר | Sprinter | 🐱🐱🐱 | Card 21 - Sprinter (rarity 3): an athletic cat mid-run on a red running track, wearing a headband and a gold medal, dynamic motion lines. |
| 22 | ג'ונגלית | Jungle | 🐱🐱🐱 | Card 22 - Jungle (rarity 3): an explorer cat in a rainforest with a colorful parrot on its shoulder, giant leaves and orchids, lush greens. |
| 23 | נהג האוטובוס | Captain Bus | 🐱🐱🐱 | Card 23 - Captain Bus (rarity 3): a cat driving a cheerful yellow school bus, kids' backpacks visible in windows, blue sky. |
| 24 | מדענית | Sparky | 🐱🐱🐱 | Card 24 - Sparky (rarity 3): a scientist cat in a white lab coat with goggles, bubbling colorful potions and glowing glass flasks. |
| 25 | מיאו־לין | Meowlin | 🐱🐱🐱🐱 | Card 25 - Meowlin (rarity 4): a wizard cat with a tall starry hat and a glowing wand casting sparkles, magical purple night sky. |
| 26 | אסטרו | Astro | 🐱🐱🐱🐱 | Card 26 - Astro (rarity 4): an astronaut cat in a space helmet standing on the moon, planet Earth glowing in the background, stars. |
| 27 | קפטן שפם | Captain Whisker | 🐱🐱🐱🐱 | Card 27 - Captain Whisker (rarity 4): a pirate captain cat with a tricorn hat and a telescope on the deck of a ship at sunset, golden waves. |
| 28 | פיית פרווה | Fairy Fluff | 🐱🐱🐱🐱 | Card 28 - Fairy Fluff (rarity 4): a fairy cat with glittering butterfly wings among glowing mushrooms in an enchanted forest, fireflies. |
| 29 | גלקסיה | Galaxy | 🐱🐱🐱🐱🐱 | Card 29 - Galaxy (rarity 5): a legendary cosmic cat whose fur looks like a galaxy night sky full of stars and nebula colors, floating among glowing constellations, shimmering aura. |
| 30 | מלכת הזהב | Golden Queen | 🐱🐱🐱🐱🐱 | Card 30 - Golden Queen (rarity 5): a majestic legendary golden cat wearing a jeweled crown with large feathered golden wings and rays of light, radiant sparkles, royal palace of clouds. |

## רשימה נקייה להעתקה

```
Card 01 - Ginger (rarity 1): a plump orange tabby cat sitting calmly, soft pastel yellow background.
Card 02 - Midnight (rarity 1): a sleek black cat with big green eyes sitting under a crescent moon, deep blue background.
Card 03 - Snowball (rarity 1): a fluffy white cat with blue eyes, light sky-blue background with a few snowflakes.
Card 04 - Misty (rarity 1): a soft gray cat sitting among small fluffy clouds, pale lavender background.
Card 05 - Patches (rarity 1): a calico cat with orange, black and white patches, mint green background.
Card 06 - Yarn (rarity 1): a playful kitten tangled in a big ball of red yarn, warm peach background.
Card 07 - Snooze (rarity 1): a sleepy kitten curled up in a woven basket with little floating 'z' bubbles (no letters, use round bubbles only), cozy beige background.
Card 08 - Stripes (rarity 1): a gray tiger-striped cat walking with its tail held high, light green background.
Card 09 - Socks (rarity 1): a black cat with four bright white paws that look like socks, soft pink background.
Card 10 - Boxy (rarity 1): a cat squeezed happily into a box that is too small for it, light brown background.
Card 11 - Sandy (rarity 2): a cat wearing a straw sun hat on a sunny beach with a small bucket and shell, turquoise sea behind.
Card 12 - Drizzle (rarity 2): a cat in a yellow raincoat holding a small umbrella, jumping in puddles, rainy day with a tiny rainbow.
Card 13 - Cookie (rarity 2): a baker cat in a chef hat holding a tray of cookies, warm kitchen background.
Card 14 - Beats (rarity 2): a cat wearing big headphones, bobbing to music, floating colorful music notes, purple background.
Card 15 - Blossom (rarity 2): a cat with a flower crown sitting in a blooming garden, butterflies around.
Card 16 - Snap (rarity 2): a cat holding a vintage camera with a big lens, sunny park background.
Card 17 - Wheelie (rarity 2): a cool cat riding a skateboard wearing a helmet, bright urban background with sparkles of motion.
Card 18 - Frosty (rarity 2): a cat in a knitted red scarf and hat in a snowy forest, gentle snowfall.
Card 19 - Bookworm (rarity 3): a cat librarian with round glasses sitting on a stack of books in a cozy old library, warm wooden shelves and golden light.
Card 20 - Professor Purr (rarity 3): a cat mathematician with a pencil behind its ear next to a blackboard covered with chalk drawings of shapes and dots (no readable numbers or letters).
Card 21 - Sprinter (rarity 3): an athletic cat mid-run on a red running track, wearing a headband and a gold medal, dynamic motion lines.
Card 22 - Jungle (rarity 3): an explorer cat in a rainforest with a colorful parrot on its shoulder, giant leaves and orchids, lush greens.
Card 23 - Captain Bus (rarity 3): a cat driving a cheerful yellow school bus, kids' backpacks visible in windows, blue sky.
Card 24 - Sparky (rarity 3): a scientist cat in a white lab coat with goggles, bubbling colorful potions and glowing glass flasks.
Card 25 - Meowlin (rarity 4): a wizard cat with a tall starry hat and a glowing wand casting sparkles, magical purple night sky.
Card 26 - Astro (rarity 4): an astronaut cat in a space helmet standing on the moon, planet Earth glowing in the background, stars.
Card 27 - Captain Whisker (rarity 4): a pirate captain cat with a tricorn hat and a telescope on the deck of a ship at sunset, golden waves.
Card 28 - Fairy Fluff (rarity 4): a fairy cat with glittering butterfly wings among glowing mushrooms in an enchanted forest, fireflies.
Card 29 - Galaxy (rarity 5): a legendary cosmic cat whose fur looks like a galaxy night sky full of stars and nebula colors, floating among glowing constellations, shimmering aura.
Card 30 - Golden Queen (rarity 5): a majestic legendary golden cat wearing a jeweled crown with large feathered golden wings and rays of light, radiant sparkles, royal palace of clouds.
```
