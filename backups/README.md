# Project Backups

This directory stores timestamped backups of the ReportRelief project taken before deployment.

## Backup Structure

Each backup is stored in a folder with the format: `backup-YYYY-MM-DD-HH-MM-SS`

Example: `backup-2026-01-12-14-30-45` contains a complete snapshot of the project from January 12, 2026 at 2:30:45 PM.

## Creating a Backup

Run the backup script before deployment:

```bash
# Windows PowerShell
node scripts/backup.js

# Or use npm
npm run backup
```

## Viewing Backups

List all available backups:
```bash
ls backups
```

Each backup folder contains the full project state at the time of creation.

## Restore from Backup

To restore a specific backup:
1. Copy the desired backup folder contents
2. Paste into the root project directory
3. Run `npm install` to ensure dependencies are fresh

## Automated Pre-Deployment Backup

The deploy script is configured to automatically create a backup before deployment:

```bash
npm run deploy  # Creates backup automatically, then deploys
```

## Notes

- Backups are stored locally and **not** tracked in git (see `.gitignore`)
- Each backup includes all project files except `node_modules` and `.env.local` for security
- Regular backups are recommended to prevent data loss during problematic deployments
