/**
 * Renders the Android launcher icons from the masters in assets/.
 *
 * We do this by hand rather than with @capacitor/assets because that tool insets both
 * adaptive layers by 16.7% to push a logo into the mask safe zone. Our background is a
 * full-bleed brand field, and insetting it leaves transparent margins the launcher mask
 * then crops into. So the background is a colour resource instead, and the foreground
 * master already places the ball inside the safe zone.
 */
import sharp from 'sharp';
import { rm } from 'node:fs/promises';

const RES = 'android/app/src/main/res';

/** Android density buckets, as multiples of mdpi. */
const DENSITIES = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/** Legacy launcher icons are 48dp; an adaptive layer is 108dp. */
const LEGACY_DP = 48;
const ADAPTIVE_DP = 108;

/** Renders one of the SVG masters at an exact pixel size. */
const render = (master, size) =>
  sharp(`assets/${master}.svg`, { density: 384 }).resize(size, size).png();

/** A white disc used to knock the square icon into the round launcher variant. */
const circleMask = (size) =>
  Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
  );

for (const [bucket, factor] of Object.entries(DENSITIES)) {
  const dir = `${RES}/mipmap-${bucket}`;
  const legacy = Math.round(LEGACY_DP * factor);
  const adaptive = Math.round(ADAPTIVE_DP * factor);

  await render('icon-only', legacy).toFile(`${dir}/ic_launcher.png`);

  const flat = await render('icon-only', legacy).toBuffer();
  await sharp(flat)
    .composite([{ input: circleMask(legacy), blend: 'dest-in' }])
    .png()
    .toFile(`${dir}/ic_launcher_round.png`);

  await render('icon-foreground', adaptive).toFile(`${dir}/ic_launcher_foreground.png`);

  // The red field is a colour resource, so any bitmap background is stale.
  await rm(`${dir}/ic_launcher_background.png`, { force: true });

  console.log(`${bucket}: launcher ${legacy}px · adaptive foreground ${adaptive}px`);
}
