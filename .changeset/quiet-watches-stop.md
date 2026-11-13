---
"kopflos": patch
---

Fix overlapping watch restarts and processes remaining alive after stopping the server. Debounce file changes by 200 ms to group multi-file saves into one restart.
