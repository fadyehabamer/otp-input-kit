import { isRTLLocale } from './locales.js';
import { getDir } from '../utils/dom.js';

/**
 * Manages RTL layout, navigation direction, and mirrored animations.
 */
export class RTLManager {
  constructor(instance) {
    this.instance = instance;
  }

  /** Resolve effective direction from options, locale, and DOM context */
  resolveDirection() {
    const { direction, locale } = this.instance.options;

    if (direction === 'rtl') return 'rtl';
    if (direction === 'ltr') return 'ltr';

    // 'auto' or unset: check locale, then DOM
    if (direction === 'auto' || !direction) {
      if (locale && isRTLLocale(locale)) return 'rtl';
      return getDir(this.instance.container);
    }
    return 'ltr';
  }

  get isRTL() {
    return this.resolveDirection() === 'rtl';
  }

  applyDirection(container) {
    const dir = this.resolveDirection();
    container.setAttribute('dir', dir);
    container.dataset.dir = dir;
  }

  /**
   * Convert visual index to logical index.
   * In RTL mode, the first visual slot (leftmost) is the LAST logical digit.
   */
  visualToLogical(visualIdx, length) {
    return this.isRTL ? length - 1 - visualIdx : visualIdx;
  }

  logicalToVisual(logicalIdx, length) {
    return this.isRTL ? length - 1 - logicalIdx : logicalIdx;
  }

  /**
   * Get the next focus target index given a "forward" movement.
   * Forward = toward the end of the OTP value (higher logical index).
   */
  nextIndex(currentIdx, inputs) {
    const next = currentIdx + 1;
    return next < inputs.length ? next : null;
  }

  prevIndex(currentIdx) {
    const prev = currentIdx - 1;
    return prev >= 0 ? prev : null;
  }

  /**
   * Arrow key mapping: in RTL, Left arrow = forward, Right = backward (visually reversed)
   */
  arrowKeyDirection(key, isRTL) {
    if (key === 'ArrowRight') return isRTL ? 'prev' : 'next';
    if (key === 'ArrowLeft')  return isRTL ? 'next' : 'prev';
    return null;
  }

  getMirroredAnimation(animName) {
    const mirrored = { fadeInRight: 'fadeInLeft', slideInRight: 'slideInLeft' };
    return this.isRTL ? (mirrored[animName] || animName) : animName;
  }
}
