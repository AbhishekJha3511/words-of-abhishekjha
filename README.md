# Abhishek Jha — Words That Remain

A responsive vintage-inspired poetry website powered directly by a published Google Sheets CSV. No Google Cloud project, API key, service account, Google Drive, image hosting, or separate database is required.

## Run locally
1. Install Node.js LTS.
2. Open this folder in VS Code.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL shown by Vite.

## Google Sheets connection
The website reads this published CSV directly:

`https://docs.google.com/spreadsheets/d/e/2PACX-1vRqo8jMd-cCTPtOtBgR5APClmG36rz1hN9xA9iIO375R6OZLRe3t5Q_Y1OOwkFFUx0N4kd8rMUxEXdX/pub?gid=0&single=true&output=csv`

The sheet's first row must contain these headers (capitalization does not matter):

`id, slug, title, category, language, excerpt, body, imageFileId, status, publishedAt, tags`

The website ignores imageFileId. It only displays rows with `status` set to `Published`. Use `Draft` or `Archived` for rows that should not appear publicly. The CSV reader supports commas, quotation marks, and line breaks inside quoted cells.

To update content, edit the Google Sheet. The website fetches the latest published CSV when a visitor loads or refreshes the page.

## Important privacy note
A published CSV is public. Anyone with its published URL can read all values in that published tab, including rows marked Draft or Archived. The website filters those statuses for display, but this is not a privacy boundary. Keep private drafts and sensitive information in a separate, unpublished tab or spreadsheet.

## Deploy to Vercel
1. Push this project to GitHub.
2. Import the repository into Vercel.
3. Keep the default Vite build command `npm run build` and output directory `dist`.
4. Deploy. No environment variables or Google Cloud setup are required.

## Current features and limitations
- Public poetry, sayings and thoughts loaded from Google Sheets.
- Search and category filters, full-reading modal, local browser likes, and share/copy links.
- No image UI or image storage.
- Likes are currently stored only in the visitor's browser and are not shared between visitors/devices.
- Comments and owner moderation are not implemented in this version.
- This website reads the Sheet; it does not edit it. Manage writing directly in Google Sheets.
