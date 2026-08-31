# Spectra

Two calendar-based note-taking apps for Spectra's office, in one project.

## Minutes (`#/minutes`)

- **Calendar** — click any date to open a notepad popup for that day.
- **Format button** — type freely, then hit Format to tidy the text: extra
  blank lines are collapsed and every line becomes an editable block.
- **Per-line list formatting** — touch any line to open a small menu and turn
  it into a bullet point, a specific number (you choose the number), or plain
  text.
- **12-color tagging** — tag each day's minutes with one of 12 palette
  colors; the color shows up as a dot on the calendar so meetings are easy to
  spot at a glance.
- **Autosave** — everything is saved to the browser's local storage as you
  type, so nothing is lost when you close the popup.

## Weekly Missions (`#/missions`)

A second calendar for tracking tasks that come out of a meeting.

- Click a date and type up the meeting's decisions, same notepad popup as
  Minutes.
- The first time you type something, the app asks **"Is this a parent
  note?"**. Say yes if the note assigns tasks to other dates.
- On a parent note, write one task per line, in whichever of these reads
  naturally — Format understands all of them:

  ```
  John will prepare the quarterly report by September 1st.
  Mary needs to submit the budget draft before Sept 3.
  John - Sept 5: Follow up with vendor
  ```

- Click **Format** and the note is reorganized into two clear groups —
  **Action items** (each task, tagged with who owns it and its date) and
  **Notes** (everything else, untouched) — so nothing typed gets lost, even
  a line it couldn't confidently parse (that's kept as plain text, with a
  warning explaining why it wasn't distributed).
- Each action item is also pushed onto its target date's own note, tagged
  with the person's name and where it came from. Re-clicking Format
  refreshes what was distributed (no duplicates) — and if someone has
  already edited their copy of a task, that edit is left alone rather than
  being overwritten.
- Any date with assigned tasks shows the assignees' names right on the
  calendar day card, before you even click it in.
- Dates also support the same bullet/number-per-line formatting and 12-color
  tagging as Minutes.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
```
