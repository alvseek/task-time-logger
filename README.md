# Task Time Logger

A single-file task timer. Add the tasks you intend to work on, press **Start** on the one you're doing, **Stop** when you pause or finish, and **Done** to archive it — then copy the archived work straight into Excel.

No install. No server. No account. One HTML file you double-click.

## Use it

1. Open `index.html` (double-click it, or bookmark it in your browser).
2. Type a task and press **Add task** — repeat for everything on your list.
3. Press **Start** on the task you're working on, and **Stop** when you pause. A task can be started and stopped as many times as you like — its time adds up.
4. Press **Done** when the task is finished. It moves to **Archived**. Changed your mind? The **↩** on an archived row restores it to the open list.
5. In **Archived**, narrow the list with the **From** and **To** date boxes, then press **Copy for Excel** and paste.

Forgot to time something? Press **Add manually**, pick when it happened and how many minutes it took, type the task name, then **Add** — it lands in the archive, already done.

## What it records

Every archived row is one work session:

| Task | Date | Start | Stop | Duration |
| --- | --- | --- | --- | --- |
| Write the report | 2026-09-24 | 2026-09-24 15:26:11 | 2026-09-24 15:41:02 | 00:14:51 |

A task started and stopped three times produces three rows. The date filter is applied to the session — the day the work happened — and **Copy for Excel** copies exactly the rows on screen, newest first, as tab-separated text that pastes into Excel, Google Sheets and LibreOffice.

## Where your data lives

In the browser's `localStorage`, keyed to the page's origin. That means it survives:

- a normal reload, and a hard reload (`Ctrl+F5`)
- closing the tab or the browser
- restarting the machine

It does **not** survive: clearing browsing data (cookies and site data), opening the file in a different browser or profile, or an incognito window.

Because the store is keyed to the `file://` origin and not the path, moving or renaming the file keeps your log.

## Notes

- One task runs at a time. While a timer runs, the other **Start** buttons are disabled — press **Stop** first.
- The **✎** on an open task renames it. In the archive, the **✎** on a row edits that entry's task and times (the **Save** applies to the whole task name), and the **×** deletes that one entry. Deleting a task's last entry removes the task.
- While a timer runs, the tab title shows a live `● HH:MM:SS`, so you can read it from the tab strip.
- **Clear all** empties everything — open tasks, the archive, and any running timer.
- Logs made with the earlier version of this file are imported automatically the first time this page loads, as archived tasks. Nothing is deleted.
- The log is per-browser, so it does not follow you between machines.

## Roadmap

- Export the log to a real `.csv` file (download)

## License

Apache-2.0 — see [LICENSE](LICENSE).
