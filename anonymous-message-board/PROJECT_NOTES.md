# Run locally

Install dependencies with `npm install`. Set `NODE_ENV=test`, `PORT=3003`, and `DB=file:.data/boards.json`, then run `npm start`. These values may be saved in an untracked `.env` file.

The file-backed database persists atomically and is excluded from Git. Deletion passwords use salted scrypt hashes. Read responses omit password and moderation fields. The supplied frontend escapes thread and reply text before rendering. All ten functional tests run automatically in test mode.
