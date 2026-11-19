/**
 * Export the approved favicon SVG without changing its composition.
 * Authoring only; no site/runtime dependency is added.
 * Use an already-installed sharp via SOLLAHMS_SHARP_MODULE if necessary.
 */
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const sharp = createRequire(import.meta.url)(process.env.SOLLAHMS_SHARP_MODULE || 'sharp');
const source = new URL('../assets/branding/favicon.svg', import.meta.url);
const target = new URL('../assets/branding/favicon.png', import.meta.url);
const svg = await readFile(source);
const svgText = svg.toString('utf8');
assert.match(svgText, /width="512" height="512" viewBox="0 0 512 512"/);
const render = () => sharp(svg, {density:72}).resize(512,512,{fit:'fill'});
const encode = () => render().png({compressionLevel:9,adaptiveFiltering:false,palette:false}).toBuffer();
const png = await encode();
assert.deepEqual(await encode(), png, 'PNG export must be byte deterministic');
const reference = await render().ensureAlpha().raw().toBuffer({resolveWithObject:true});
const decoded = await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(decoded.info.width,512);
assert.equal(decoded.info.height,512);
assert.equal(decoded.info.channels,4);
assert.deepEqual(decoded.data,reference.data,'PNG pixels must match the direct 512px SVG raster');
await writeFile(target,png);
const sha256 = data => createHash('sha256').update(data).digest('hex');
console.log(JSON.stringify({source:'assets/branding/favicon.svg',sourceSHA256:sha256(svg),target:'assets/branding/favicon.png',pngSHA256:sha256(png),width:512,height:512,pixelsMatchDirectSvgRaster:true,deterministicBytes:true,rgbaSHA256:sha256(decoded.data),renderer:{sharp:sharp.versions.sharp,vips:sharp.versions.vips,cairo:sharp.versions.cairo,rsvg:sharp.versions.rsvg}}));
