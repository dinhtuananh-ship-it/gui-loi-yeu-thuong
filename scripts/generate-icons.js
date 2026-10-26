const path = require("node:path");
const fs = require("node:fs/promises");
const sharp = require("sharp");

const directory = path.join(__dirname, "../public/icons");

async function main() {
    const svg = await fs.readFile(path.join(directory, "icon.svg"));
    await Promise.all([192, 512].map(size =>
        sharp(svg).resize(size, size).png().toFile(path.join(directory, `icon-${size}.png`))));
    // The whole artwork stays within the safe central area of the maskable icon.
    await sharp(svg).resize(390, 390).extend({ top: 61, bottom: 61, left: 61, right: 61, background: "#ad635d" })
        .png().toFile(path.join(directory, "icon-maskable-512.png"));
}

main().catch(err => { console.error(err); process.exitCode = 1; });
