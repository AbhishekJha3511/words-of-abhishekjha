# Google Sheets setup (no Google Cloud)

The site uses a Google Sheets **Publish to web → CSV** link. It does not use Google Cloud Console, Google Sheets API, API keys, service accounts, or Google Drive.

## Required columns
The `Poetry` tab should have these headers in row 1:

`id | slug | title | category | language | excerpt | body | imageFileId | status | publishedAt | tags`

The `imageFileId` column is ignored and may be left blank or removed. The website reads `id`, `title`, `category`, `language`, `excerpt`, `body`, `status`, `publishedAt`, and `tags`.

## Publishing
1. In Google Sheets, choose **File → Share → Publish to web**.
2. Select the `Poetry` tab.
3. Choose **Comma-separated values (.csv)**.
4. Publish and use the published CSV URL in `src/App.tsx` as `SHEET_CSV_URL`.

Only rows with `status` = `Published` are shown on the website. `Draft` and `Archived` rows are filtered out by the website.

**Privacy:** Publishing a tab exposes its entire CSV to anyone with the link. The website's status filter only controls what the site displays; it does not hide draft rows from someone who opens the CSV URL. Keep private drafts in a separate unpublished tab.
