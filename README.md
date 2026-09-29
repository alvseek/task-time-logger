# Task Time Logger

A single-file time tracker. Type what you're working on, press **Start**, press **Stop** when you're done — the entry lands in a table you can paste straight into Excel.

No install. No server. No account. One HTML file you double-click.

## Use it

1. Open `index.html` (double-click it, or bookmark it in your browser).
2. Type the task, press **Start** — or just hit **Enter**.
3. Press **Stop** when the task is finished.
4. Press **Copy for Excel**, then paste into a spreadsheet.

Forgot to time something? Press **Add manually**, pick when it happened and type how many minutes it took, then **Add** — the entry joins the same table.

Got something wrong? The **✎** on a row opens it for editing. Change the task, the start or the stop, then **Save** — the duration follows the times.

## What it records

| Task | Start | Stop | Duration |
| --- | --- | --- | --- |
| Write the report | 2026-09-24 15:26:11 | 2026-09-24 15:41:02 | 00:14:51 |

Newest entry sits on top. **Copy for Excel** copies the whole table as tab-separated text, which pastes into columns in Excel, Google Sheets and LibreOffice.

## Where your data lives

In the browser's `localStorage`, keyed to the page's origin. That means it survives:

- a normal reload, and a hard reload (`Ctrl+F5`)
- closing the tab or the browser
- restarting the machine

It does **not** survive: clearing browsing data (cookies and site data), opening the file in a different browser or profile, or an incognito window.

Because the store is keyed to the `file://` origin and not the path, moving or renaming the file keeps your log.

## Notes

- **Enter** starts and stops the timer — while the **Add manually** panel is open, it adds that entry instead.
- **Add manually** takes the task from the box above it, so type the task first. The **When** field starts at the current date and time.
- While a timer runs, the tab title shows a live `● HH:MM:SS`, so you can read it from the tab strip.
- The **✎** on a row edits it in place — **Save** applies, **Escape** or **Cancel** discards, and **Enter** saves. One row is edited at a time.
- The **×** on a row deletes that entry. **Clear all** empties the log.
- The log is per-browser, so it does not follow you between machines.

## Roadmap

- Export the log to a real `.csv` file (download)
- Track a date column so multi-day logs group cleanly in Excel
- Named tasks / resume a recent task

## License

Apache-2.0 — see [LICENSE](LICENSE).
