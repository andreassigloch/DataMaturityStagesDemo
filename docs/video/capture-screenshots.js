#!/usr/bin/env node
/**
 * Screenshot Capture für Demo-Video
 *
 * Nutzt Puppeteer um Screenshots vom Dashboard zu machen.
 *
 * Usage: node capture-screenshots.js
 *
 * Abhängigkeiten: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FRAMES_DIR = path.join(__dirname, 'frames');
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5177';

// Stelle sicher, dass Verzeichnis existiert
if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starte Browser...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Screenshot 1: Knowledge Graph Tab
    console.log('📸 Capturing Knowledge Graph...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(2000); // Warte auf Graph-Animation
    await page.screenshot({
      path: path.join(FRAMES_DIR, '04-dashboard-overview.png'),
      fullPage: false
    });
    console.log('✅ 04-dashboard-overview.png');

    // Screenshot 2: Centrality Metrics Tab
    console.log('📸 Capturing Centrality Metrics...');
    await page.click('text=Centrality');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(FRAMES_DIR, '05-dashboard-centrality.png')
    });
    console.log('✅ 05-dashboard-centrality.png');

    // Screenshot 3: Detected Patterns Tab
    console.log('📸 Capturing Detected Patterns...');
    await page.click('text=Patterns');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(FRAMES_DIR, '06-dashboard-patterns.png')
    });
    console.log('✅ 06-dashboard-patterns.png');

    // Screenshot 4: Rules Tab
    console.log('📸 Capturing Rules...');
    await page.click('text=Rules');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(FRAMES_DIR, '07-dashboard-rules.png')
    });
    console.log('✅ 07-dashboard-rules.png');

    // Screenshot 5: Learning Timeline Tab
    console.log('📸 Capturing Learning Timeline...');
    await page.click('text=Timeline');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(FRAMES_DIR, '08-dashboard-timeline.png')
    });
    console.log('✅ 08-dashboard-timeline.png');

    console.log('\n✅ Alle Screenshots gespeichert in:', FRAMES_DIR);

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.log('\n⚠️ Stelle sicher, dass das Dashboard läuft:');
    console.log('   cd dashboard && npm run dev');
  } finally {
    await browser.close();
  }
}

// Alternative: Nutze page.evaluate für Tab-Klicks
async function captureWithEvaluate() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const tabs = [
    { name: 'Übersicht', file: '04-dashboard-overview.png', selector: null },
    { name: 'Wichtigkeit', file: '05-dashboard-centrality.png', selector: 'Wichtigkeit' },
    { name: 'Qualitätsprobleme', file: '06-dashboard-patterns.png', selector: 'Qualitätsprobleme' },
    { name: 'Prüfregeln', file: '07-dashboard-rules.png', selector: 'Prüfregeln' },
    { name: 'Lernverlauf', file: '08-dashboard-timeline.png', selector: 'Lernverlauf' }
  ];

  try {
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    for (const tab of tabs) {
      console.log(`📸 Capturing ${tab.name}...`);

      if (tab.selector) {
        // Klicke auf Tab
        await page.evaluate((text) => {
          const elements = document.querySelectorAll('button, a, [role="tab"]');
          for (const el of elements) {
            if (el.textContent.includes(text)) {
              el.click();
              break;
            }
          }
        }, tab.selector);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        await new Promise(r => setTimeout(r, 2000)); // Erster Tab, warte auf Load
      }

      await page.screenshot({
        path: path.join(FRAMES_DIR, tab.file)
      });
      console.log(`✅ ${tab.file}`);
    }

    console.log('\n✅ Alle Screenshots gespeichert!');

  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await browser.close();
  }
}

// Main
async function main() {
  console.log('🎬 Screenshot Capture Tool');
  console.log('=========================\n');

  // Prüfe ob Dashboard erreichbar
  const http = require('http');
  const checkUrl = new Promise((resolve) => {
    http.get(DASHBOARD_URL, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });

  const isRunning = await checkUrl;

  if (!isRunning) {
    console.log('❌ Dashboard nicht erreichbar auf', DASHBOARD_URL);
    console.log('\n📝 Starte das Dashboard:');
    console.log('   cd dashboard && npm run dev');
    console.log('   cd dashboard/server && npm run dev\n');
    process.exit(1);
  }

  await captureWithEvaluate();
}

main().catch(console.error);
