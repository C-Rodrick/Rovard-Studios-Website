// Entry point. Each concern lives in its own module; only what a page needs does any work.
import { initNav } from './nav.js';
import { initMotion } from './motion.js';
import { initWork, initLightbox } from './portfolio.js';
import { initForms } from './forms.js';
import { initStage } from './stage-control.js';

initNav();
initWork();
initLightbox();
initForms();
initMotion();
initStage();
