// Used only by tools/oa/stills.py to render the static fallback images from the real sculpture.
import { createStage } from './stage.js';

const q = new URLSearchParams(location.search);
const canvas = document.querySelector('canvas');
const stage = createStage(canvas, { tier: 'high', still: true });
stage.setIdle(false);
stage.resize();
stage.set(q.get('state') || 'hero');
stage.render();
document.documentElement.dataset.ready = '1';
