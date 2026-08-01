// scripts/toggle-dynamic-routes.js
const fs = require("fs");
const path = require("path");

const action = process.argv[2]; // "hide" or "restore"

// Determine if we are building a static export
// If STATIC_EXPORT is true, or if VERCEL is not set (meaning local build/GitHub Pages deployment)
const isStatic = process.env.STATIC_EXPORT === "true" || !process.env.VERCEL;

const appDir = path.join(__dirname, "../src/app");
const backupDir = path.join(__dirname, "../src/app-dynamic-backup");

const targets = ["api", "unsubscribe"];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

if (action === "hide") {
  // Only hide if we are in static export mode
  if (isStatic) {
    console.log("Static export detected. Temporarily hiding dynamic API and unsubscribe routes...");
    ensureDir(backupDir);
    targets.forEach((target) => {
      const src = path.join(appDir, target);
      const dest = path.join(backupDir, target);
      if (fs.existsSync(src)) {
        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
        }
        fs.renameSync(src, dest);
        console.log(`  - Hid: ${target}`);
      }
    });

    // Also comment out force-dynamic lines in page.js and archive/page.js
    const filesToModify = [
      path.join(appDir, "page.js"),
      path.join(appDir, "archive/page.js")
    ];

    filesToModify.forEach((file) => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, "utf8");
        if (content.includes('export const dynamic = "force-dynamic";')) {
          content = content.replace(
            'export const dynamic = "force-dynamic";',
            '// export const dynamic = "force-dynamic"; // HIDDEN FOR STATIC'
          );
          fs.writeFileSync(file, content, "utf8");
          console.log(`  - Commented out force-dynamic in: ${path.relative(appDir, file)}`);
        }
      }
    });
  } else {
    console.log("Dynamic server build detected. Keeping dynamic routes active.");
  }
} else if (action === "restore") {
  // Always restore if backup exists
  if (fs.existsSync(backupDir)) {
    console.log("Restoring dynamic API and unsubscribe routes...");
    targets.forEach((target) => {
      const src = path.join(backupDir, target);
      const dest = path.join(appDir, target);
      if (fs.existsSync(src)) {
        if (fs.existsSync(dest)) {
          fs.rmSync(dest, { recursive: true, force: true });
        }
        fs.renameSync(src, dest);
        console.log(`  - Restored: ${target}`);
      }
    });
    // Remove backup dir if empty
    try {
      fs.rmdirSync(backupDir);
    } catch (e) {
      // ignore
    }
  }

  // Always attempt to restore force-dynamic lines in page.js and archive/page.js
  const filesToRestore = [
    path.join(appDir, "page.js"),
    path.join(appDir, "archive/page.js")
  ];

  filesToRestore.forEach((file) => {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, "utf8");
      if (content.includes('// export const dynamic = "force-dynamic"; // HIDDEN FOR STATIC')) {
        content = content.replace(
          '// export const dynamic = "force-dynamic"; // HIDDEN FOR STATIC',
          'export const dynamic = "force-dynamic";'
        );
        fs.writeFileSync(file, content, "utf8");
        console.log(`  - Restored force-dynamic in: ${path.relative(appDir, file)}`);
      }
    }
  });
} else {
  console.error("Invalid action. Use 'hide' or 'restore'.");
  process.exit(1);
}
