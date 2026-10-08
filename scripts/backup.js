#!/usr/bin/env node

/**
 * Backup Script for ReportRelief
 *
 * Creates a timestamped backup of the project before deployment
 * Usage: node scripts/backup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current timestamp in format: YYYY-MM-DD-HH-MM-SS
const now = new Date();
const timestamp = now.toISOString().replace(/T/, '-').replace(/:/g, '-').slice(0, 19);

const backupName = `backup-${timestamp}`;
const backupDir = path.join(__dirname, '..', 'backups', backupName);
const projectRoot = path.join(__dirname, '..');

// Create backup directory
if (!fs.existsSync(path.join(__dirname, '..', 'backups'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'backups'), { recursive: true });
}

console.log(`📦 Creating backup: ${backupName}`);
console.log(`📁 Backup location: ${backupDir}`);

try {
  // Create the backup directory
  fs.mkdirSync(backupDir, { recursive: true });

  // List of files and directories to backup
  const itemsToBackup = [
    'src',
    'components',
    'services',
    'public',
    'dist',
    'App.tsx',
    'index.tsx',
    'index.html',
    'manifest.json',
    'metadata.json',
    'sw.js',
    'tsconfig.json',
    'vite.config.ts',
    'types.ts',
    'package.json',
    'package-lock.json',
    'README.md',
    'FIREBASE_SETUP.md',
    'firebase.json',
    '.gitignore',
  ];

  itemsToBackup.forEach((item) => {
    const srcPath = path.join(projectRoot, item);
    const destPath = path.join(backupDir, item);

    if (fs.existsSync(srcPath)) {
      const stats = fs.statSync(srcPath);
      if (stats.isDirectory()) {
        // Recursively copy directory
        copyDirectory(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });

  // Create a backup manifest
  const manifest = {
    backupDate: now.toISOString(),
    timestamp: timestamp,
    nodeVersion: process.version,
    files: itemsToBackup,
    description: 'Automated backup before deployment',
  };

  fs.writeFileSync(path.join(backupDir, 'BACKUP_MANIFEST.json'), JSON.stringify(manifest, null, 2));

  console.log(`✅ Backup created successfully!`);
  console.log(`📊 Backup includes ${itemsToBackup.length} items`);
  console.log(`⏰ Timestamp: ${now.toLocaleString()}`);
} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}

/**
 * Recursively copy a directory
 */
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const files = fs.readdirSync(src);

  files.forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);

    // Skip node_modules and other ignored directories
    if (
      file === 'node_modules' ||
      file === '.env.local' ||
      file === '.env' ||
      file === '.git' ||
      file === '.gitignore' ||
      file === 'backups' ||
      file.startsWith('.')
    ) {
      return;
    }

    const stats = fs.statSync(srcFile);

    if (stats.isDirectory()) {
      copyDirectory(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}
