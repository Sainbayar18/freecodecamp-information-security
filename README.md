# Information Security

freeCodeCamp Information Security coursework and projects.

## Stock Price Checker

Run `npm install`, then set `NODE_ENV=test` and `PORT=3002` before `npm start` in `stock-price-checker`.

Stock quotes use the freeCodeCamp proxy with a Yahoo Finance fallback when a valid symbol is unavailable. Likes persist in a local JSON database; client IP addresses are stored only as salted HMAC digests. Runtime data and `.env` files are excluded from this repository.

The starter testing helpers are preserved. The app exposes the equivalent header-inspection route using the supported Node response-header API for current Node versions.
