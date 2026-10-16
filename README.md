# freeCodeCamp Information Security

Completed coursework and five certification projects, October 16, 2026.

## Projects

| Project | Folder | Run / validate |
| --- | --- | --- |
| Stock Price Checker | `stock-price-checker` | `npm install`; set `NODE_ENV=test`, `PORT=3002`; `npm start` |
| Anonymous Message Board | `anonymous-message-board` | `npm install`; set `NODE_ENV=test`, `PORT=3003`, `DB=file:.data/boards.json`; `npm start` |
| Port Scanner | `port-scanner` | `python -m unittest test_local test_module -v` |
| SHA-1 Password Cracker | `sha1-password-cracker` | `python -m unittest test_module test_additional -v` |
| Secure Real-Time Multiplayer Game | `multiplayer-game` | `npm install`; set `NODE_ENV=test`, `PORT=3004`; `npm start`; `npm test` |

Use Node 24+ for the JavaScript projects and Python 3.12+ for the Python projects. Environment settings may be placed in untracked `.env` files. Install the native bcrypt dependency when running the BCrypt lessons; if npm asks to approve its known package install step, use `npm install-scripts approve bcrypt`.

## Lesson source

- `helmetjs`: Helmet 3.21.3 middleware exercises. Run `npm install` and `npm start` (port 3000).
- `bcrypt`: asynchronous and synchronous password hashing/comparison. Run `npm install`; set `PORT=3001`; run `npm start`.

## Validation

- HelmetJS/BCrypt: 14 of 14 lessons completed in freeCodeCamp.
- Python for Penetration Testing: 7 of 7 lessons completed in freeCodeCamp.
- Stock Price Checker: all five functional tests passed; all seven freeCodeCamp checks passed.
- Anonymous Message Board: all ten functional tests passed; all thirteen freeCodeCamp checks passed.
- Port Scanner: all three local socket/validation tests passed; seven of eight unchanged original internet integration tests passed. The historical target `209.216.230.240:443` did not accept a TCP connection from the test environment, including an eight-second direct check. The actual network result is returned without hardcoding expected ports. This limitation was documented and explicitly accepted before submission. See `port-scanner/PROJECT_NOTES.md`.
- SHA-1 Password Cracker: all nine original and three additional tests passed.
- Multiplayer Game: all seventeen class, header, real WebSocket, and browser-asset tests passed; all nineteen freeCodeCamp checks passed. Two real browser tabs verified connection, disconnection, and reconnection.

## Local runtime and privacy

The JavaScript solution URLs submitted to freeCodeCamp are local development URLs. Run the relevant servers to use them on your computer. This repository publishes the source; it does not deploy those services to a public host.

Runtime data, native dependencies, and `.env` files are excluded. Stock likes store salted HMAC digests rather than raw IP addresses. Message deletion passwords are salted scrypt hashes and omitted from read responses. The supplied public SHA-1 dictionary demonstrates weak password hashing and contains no private user credentials.

Original starter testing helpers remain intact. Application-level compatibility handlers expose their intended header/source data using modern Node APIs and correct project-relative paths.
