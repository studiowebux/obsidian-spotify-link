This is the template I use to test and update this plugin

{{ episode_name }}
{{ episode_link }}
{{ description }}
{{ audio_preview_url }}
{{ episode_cover_large }}
{{ episode_cover_link_large }}

**Image dimension tests (inline override):**

Cover large, no size (uses setting default): {{ episode_cover_large }}
Cover medium, fixed 200x200: {{ episode_cover_medium|200x200 }}
Cover small, width only 100: {{ episode_cover_small|100 }}

**Date format tests (inline override):**

Raw date (uses setting default): {{ release_date }}
Year only: {{ release_date|YYYY }}
Year-Month: {{ release_date|YYYY-MM }}
Full date: {{ release_date|YYYY-MM-DD }}

**Table context — use `\|` (escaped pipe) inside Markdown tables:**

In Markdown tables `|` separates columns, so the inline override pipe must be escaped with `\|`.

| Token | Syntax | Result |
| ----- | ------ | ------ |
| episode_cover_medium | `{{ episode_cover_medium\|200x200 }}` | {{ episode_cover_medium\|200x200 }} |
| episode_cover_large | `{{ episode_cover_large\|100x100 }}` | {{ episode_cover_large\|100x100 }} |
| release_date | `{{ release_date\|YYYY }}` | {{ release_date\|YYYY }} |
