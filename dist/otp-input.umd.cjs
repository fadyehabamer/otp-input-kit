/*!
 * otp-input-kit v1.0.3
 * A highly customizable, framework-agnostic OTP input component
 * (c) 2026 — MIT License
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const __css = "/* ─── OTP Input Library — Default Theme ─────────────────────────────────────\n   All values are CSS custom properties → fully overridable per-instance.\n   ───────────────────────────────────────────────────────────────────────── */\n\n/* ── Design tokens ── */\n:root {\n  --otp-gap: 10px;\n  --otp-input-width: 52px;\n  --otp-input-height: 60px;\n  --otp-border-radius: 10px;\n  --otp-border-width: 2px;\n  --otp-border-color: #d1d5db;\n  --otp-focus-color: #3b82f6;\n  --otp-focus-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);\n  --otp-error-color: #ef4444;\n  --otp-error-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);\n  --otp-success-color: #22c55e;\n  --otp-success-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);\n  --otp-bg: #ffffff;\n  --otp-filled-bg: #f0f9ff;\n  --otp-disabled-bg: #f3f4f6;\n  --otp-text-color: #111827;\n  --otp-placeholder-color: #d1d5db;\n  --otp-font-size: 1.625rem;\n  --otp-font-weight: 700;\n  --otp-font-family: inherit;\n  --otp-letter-spacing: 0.05em;\n  --otp-transition: 0.18s ease;\n\n  /* Timer */\n  --otp-timer-color: #6b7280;\n  --otp-timer-urgent-color: #ef4444;\n  --otp-timer-font-size: 0.875rem;\n  --otp-progress-height: 3px;\n  --otp-progress-bg: #e5e7eb;\n  --otp-progress-fill: #3b82f6;\n\n  /* Resend */\n  --otp-resend-color: #3b82f6;\n  --otp-resend-disabled-color: #9ca3af;\n  --otp-resend-font-size: 0.875rem;\n\n  /* Paste suggestion */\n  --otp-paste-bg: #eff6ff;\n  --otp-paste-border: #bfdbfe;\n  --otp-paste-color: #1d4ed8;\n  --otp-paste-font-size: 0.8125rem;\n}\n\n/* ── Dark mode auto-detection ── */\n@media (prefers-color-scheme: dark) {\n  :root {\n    --otp-bg: #1f2937;\n    --otp-filled-bg: #1e3a5f;\n    --otp-disabled-bg: #374151;\n    --otp-border-color: #374151;\n    --otp-text-color: #f9fafb;\n    --otp-placeholder-color: #4b5563;\n    --otp-progress-bg: #374151;\n    --otp-paste-bg: #1e3a5f;\n    --otp-paste-border: #1e40af;\n    --otp-paste-color: #93c5fd;\n    --otp-timer-color: #9ca3af;\n  }\n}\n\n/* ── Root container ── */\n.otp-root {\n  position: relative;\n  display: inline-block;\n  width: 100%;\n}\n\n.otp-wrapper {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n}\n\n/* ── Inputs row ── */\n.otp-inputs-row {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: center;\n  gap: var(--otp-gap);\n  width: 100%;\n}\n\n/* RTL: inputs are already in DOM order; CSS dir handles visual flip */\n[dir=\"rtl\"] .otp-inputs-row {\n  flex-direction: row-reverse;\n}\n\n/* ── Digit separator ── */\n.otp-separator {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: var(--otp-separator-color, var(--otp-border-color, #cbd5e1));\n  font-size: 1.2em;\n  font-weight: 300;\n  letter-spacing: -0.02em;\n  user-select: none;\n  padding: 0 2px;\n  flex-shrink: 0;\n  transition: color 0.2s;\n}\n\n/* ── Individual input ── */\n.otp-input {\n  width: var(--otp-input-width);\n  height: var(--otp-input-height);\n  padding: 0;\n  border: var(--otp-border-width) solid var(--otp-border-color);\n  border-radius: var(--otp-border-radius);\n  background: var(--otp-bg);\n  color: var(--otp-text-color);\n  font-size: var(--otp-font-size);\n  font-weight: var(--otp-font-weight);\n  font-family: var(--otp-font-family);\n  letter-spacing: var(--otp-letter-spacing);\n  text-align: center;\n  outline: none;\n  cursor: text;\n  -webkit-appearance: none;\n  appearance: none;\n  transition:\n    border-color var(--otp-transition),\n    background-color var(--otp-transition),\n    box-shadow var(--otp-transition),\n    transform var(--otp-transition);\n  user-select: text;\n}\n\n/* Remove number spinners */\n.otp-input[type=\"number\"]::-webkit-inner-spin-button,\n.otp-input[type=\"number\"]::-webkit-outer-spin-button {\n  -webkit-appearance: none;\n}\n\n/* Placeholder styling */\n.otp-input::placeholder {\n  color: var(--otp-placeholder-color);\n  font-size: calc(var(--otp-font-size) * 0.6);\n  font-weight: 400;\n}\n\n/* ── States ── */\n.otp-input--focused {\n  border-color: var(--otp-focus-color);\n  box-shadow: var(--otp-focus-shadow);\n  z-index: 1;\n}\n\n.otp-input--filled {\n  background: var(--otp-filled-bg);\n  border-color: var(--otp-border-color);\n}\n\n.otp-input--error {\n  border-color: var(--otp-error-color) !important;\n  box-shadow: var(--otp-error-shadow) !important;\n  background: rgba(239, 68, 68, 0.04);\n}\n\n.otp-input--success {\n  border-color: var(--otp-success-color) !important;\n  box-shadow: var(--otp-success-shadow);\n  background: rgba(34, 197, 94, 0.06);\n}\n\n.otp-root--disabled .otp-input,\n.otp-input:disabled {\n  background: var(--otp-disabled-bg);\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n\n.otp-root--expired .otp-input {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n\n/* ── Timer progress bar ── */\n.otp-timer-progress {\n  width: 100%;\n  max-width: calc(var(--otp-input-width) * 6 + var(--otp-gap) * 5 + 20px);\n  height: var(--otp-progress-height);\n  background: var(--otp-progress-bg);\n  border-radius: 999px;\n  overflow: hidden;\n}\n\n.otp-timer-progress-bar {\n  height: 100%;\n  background: var(--otp-progress-fill);\n  border-radius: 999px;\n  transition: background-color 0.3s ease;\n  width: 100%;\n}\n\n.otp-timer-progress-bar.otp-timer-progress-bar--running {\n  animation: otpProgressCountdown linear forwards;\n}\n\n.otp-timer--urgent ~ .otp-timer-progress .otp-timer-progress-bar {\n  background: var(--otp-error-color);\n}\n\n/* ── Footer (timer + resend) ── */\n.otp-footer {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  max-width: calc(var(--otp-input-width) * 6 + var(--otp-gap) * 5);\n  padding: 0 2px;\n  gap: 8px;\n}\n\n.otp-timer-wrap {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.otp-timer {\n  font-size: var(--otp-timer-font-size);\n  color: var(--otp-timer-color);\n  font-variant-numeric: tabular-nums;\n  letter-spacing: 0.02em;\n  min-width: 2.8em;\n}\n\n.otp-timer--urgent {\n  color: var(--otp-timer-urgent-color);\n  font-weight: 600;\n}\n\n/* ── Resend button ── */\n.otp-resend-btn {\n  background: none;\n  border: none;\n  padding: 4px 8px;\n  font-size: var(--otp-resend-font-size);\n  color: var(--otp-resend-color);\n  cursor: pointer;\n  border-radius: 6px;\n  font-weight: 500;\n  transition: opacity 0.15s, background-color 0.15s;\n  white-space: nowrap;\n}\n\n.otp-resend-btn:hover:not(:disabled) {\n  background: rgba(59, 130, 246, 0.1);\n}\n\n.otp-resend-btn:disabled {\n  color: var(--otp-resend-disabled-color);\n  cursor: not-allowed;\n}\n\n/* ── Paste suggestion ── */\n.otp-paste-suggestion {\n  display: flex;\n  width: fit-content;\n  align-items: center;\n  justify-content: center;\n  padding: 8px 16px;\n  margin: 0 auto;\n  background: var(--otp-paste-bg);\n  border: 1px solid var(--otp-paste-border);\n  border-radius: 8px;\n  color: var(--otp-paste-color);\n  font-size: var(--otp-paste-font-size);\n  font-weight: 500;\n  text-align: center;\n  cursor: pointer;\n  transition: opacity 0.2s;\n  animation: otpFadeInDown 0.25s ease;\n}\n\n.otp-paste-suggestion:hover {\n  opacity: 0.85;\n}\n\n/* ── Live region (visually hidden) ── */\n.otp-live-region {\n  position: absolute !important;\n  width: 1px !important;\n  height: 1px !important;\n  padding: 0 !important;\n  margin: -1px !important;\n  overflow: hidden !important;\n  clip: rect(0, 0, 0, 0) !important;\n  white-space: nowrap !important;\n  border: 0 !important;\n}\n\n/* ─── Animations ──────────────────────────────────────────────────────────── */\n\n@keyframes otpProgressCountdown {\n  from { width: 100%; }\n  to   { width: 0%; }\n}\n\n@keyframes otpShake {\n  0%, 100% { transform: translateX(0); }\n  15%       { transform: translateX(-6px) rotate(-1deg); }\n  30%       { transform: translateX(5px)  rotate(1deg); }\n  45%       { transform: translateX(-4px); }\n  60%       { transform: translateX(3px); }\n  75%       { transform: translateX(-2px); }\n}\n\n@keyframes otpPop {\n  0%   { transform: scale(1); }\n  40%  { transform: scale(1.15); }\n  70%  { transform: scale(0.95); }\n  100% { transform: scale(1); }\n}\n\n@keyframes otpHighlight {\n  0%, 100% { background-color: var(--otp-bg); }\n  50%       { background-color: rgba(239, 68, 68, 0.15); }\n}\n\n@keyframes otpFadeInDown {\n  from { opacity: 0; transform: translateY(-8px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n\n.otp-anim-shake {\n  animation: otpShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);\n}\n\n.otp-anim-pop {\n  animation: otpPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n\n.otp-anim-highlight {\n  animation: otpHighlight 0.5s ease;\n}\n\n/* RTL: mirror shake direction */\n[dir=\"rtl\"] .otp-anim-shake {\n  animation-name: otpShakeRTL;\n}\n\n@keyframes otpShakeRTL {\n  0%, 100% { transform: translateX(0); }\n  15%       { transform: translateX(6px) rotate(1deg); }\n  30%       { transform: translateX(-5px) rotate(-1deg); }\n  45%       { transform: translateX(4px); }\n  60%       { transform: translateX(-3px); }\n  75%       { transform: translateX(2px); }\n}\n\n/* ─── Responsive ──────────────────────────────────────────────────────────── */\n\n@media (max-width: 420px) {\n  :root {\n    --otp-input-width: 42px;\n    --otp-input-height: 50px;\n    --otp-font-size: 1.35rem;\n    --otp-gap: 7px;\n  }\n}\n\n@media (max-width: 340px) {\n  :root {\n    --otp-input-width: 36px;\n    --otp-input-height: 44px;\n    --otp-font-size: 1.15rem;\n    --otp-gap: 5px;\n    --otp-border-radius: 7px;\n  }\n}\n\n/* ─── Input Theme: Underline ──────────────────────────────────────────────── */\n.otp-root[data-theme=\"underline\"] .otp-input {\n  border-width: 0;\n  border-bottom-width: var(--otp-border-width);\n  border-radius: 0;\n  background: transparent;\n  box-shadow: none;\n}\n\n.otp-root[data-theme=\"underline\"] .otp-input--focused {\n  border-bottom-color: var(--otp-focus-color);\n  box-shadow: 0 2px 0 0 var(--otp-focus-color);\n}\n\n/* ─── Input Theme: Rounded ────────────────────────────────────────────────── */\n.otp-root[data-theme=\"rounded\"] .otp-input {\n  --otp-border-radius: 999px;\n}\n\n/* ─── Input Theme: Pill ───────────────────────────────────────────────────── */\n.otp-root[data-theme=\"pill\"] .otp-input {\n  --otp-border-radius: 999px;\n  --otp-input-width: 56px;\n  --otp-input-height: 56px;\n  border-width: 1.5px;\n}\n\n.otp-root[data-theme=\"pill\"] .otp-input--filled {\n  background: var(--otp-focus-color);\n  color: #fff;\n  border-color: var(--otp-focus-color);\n}\n\n/* ─── Input Theme: Ghost ──────────────────────────────────────────────────── */\n.otp-root[data-theme=\"ghost\"] .otp-input {\n  background: rgba(15, 23, 42, 0.05);\n  border-color: transparent;\n}\n\n.otp-root[data-theme=\"ghost\"] .otp-input--focused {\n  background: transparent;\n  border-color: var(--otp-focus-color);\n}\n\n@media (prefers-color-scheme: dark) {\n  .otp-root[data-theme=\"ghost\"] .otp-input { background: rgba(255,255,255,0.06); }\n}\n\n/* ─── Input Theme: Filled ─────────────────────────────────────────────────── */\n.otp-root[data-theme=\"filled\"] .otp-input {\n  background: #f1f5f9;\n  border-color: transparent;\n  border-bottom: 2px solid #cbd5e1;\n  border-radius: 8px 8px 0 0;\n}\n\n.otp-root[data-theme=\"filled\"] .otp-input--focused {\n  background: #e0f2fe;\n  border-bottom-color: var(--otp-focus-color);\n  box-shadow: none;\n}\n\n.otp-root[data-theme=\"filled\"] .otp-input--filled {\n  background: #dbeafe;\n  border-bottom-color: var(--otp-focus-color);\n}\n\n@media (prefers-color-scheme: dark) {\n  .otp-root[data-theme=\"filled\"] .otp-input { background: #334155; border-bottom-color: #475569; }\n  .otp-root[data-theme=\"filled\"] .otp-input--focused { background: #1e3a5f; }\n  .otp-root[data-theme=\"filled\"] .otp-input--filled  { background: #1e40af; color: #fff; }\n}\n\n/* ─── Input Theme: Soft ───────────────────────────────────────────────────── */\n.otp-root[data-theme=\"soft\"] .otp-input {\n  background: #f5f3ff;\n  border-color: transparent;\n  --otp-border-radius: 14px;\n  box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.15);\n}\n\n.otp-root[data-theme=\"soft\"] .otp-input--focused {\n  background: #ede9fe;\n  box-shadow: inset 0 0 0 2px #8b5cf6, 0 0 0 4px rgba(139, 92, 246, 0.15);\n}\n\n.otp-root[data-theme=\"soft\"] .otp-input--filled {\n  color: #7c3aed;\n  background: #ede9fe;\n}\n\n/* ─── Input Theme: Neon ───────────────────────────────────────────────────── */\n.otp-root[data-theme=\"neon\"] {\n  --otp-focus-color: #06ffa5;\n  --otp-focus-shadow: 0 0 16px rgba(6, 255, 165, 0.55), 0 0 0 2px rgba(6, 255, 165, 0.5);\n}\n\n.otp-root[data-theme=\"neon\"] .otp-input {\n  background: #0b0f1a;\n  border-color: #1e293b;\n  color: #06ffa5;\n  font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;\n  text-shadow: 0 0 6px rgba(6, 255, 165, 0.6);\n}\n\n.otp-root[data-theme=\"neon\"] .otp-input--focused {\n  border-color: #06ffa5;\n}\n\n.otp-root[data-theme=\"neon\"] .otp-input--filled {\n  background: #051219;\n  border-color: #06ffa5;\n  box-shadow: inset 0 0 8px rgba(6, 255, 165, 0.2);\n}\n\n/* ─── Input Theme: Gradient ───────────────────────────────────────────────── */\n.otp-root[data-theme=\"gradient\"] .otp-input {\n  background: #fff;\n  border: none;\n  position: relative;\n  background-image:\n    linear-gradient(#fff, #fff),\n    linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n  background-origin: border-box;\n  background-clip: padding-box, border-box;\n  border: 2px solid transparent;\n}\n\n.otp-root[data-theme=\"gradient\"] .otp-input--focused {\n  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);\n}\n\n.otp-root[data-theme=\"gradient\"] .otp-input--filled {\n  background-image:\n    linear-gradient(135deg, #eef2ff, #fdf2f8),\n    linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n}\n\n@media (prefers-color-scheme: dark) {\n  .otp-root[data-theme=\"gradient\"] .otp-input {\n    background-image:\n      linear-gradient(#1e293b, #1e293b),\n      linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n  }\n  .otp-root[data-theme=\"gradient\"] .otp-input--filled {\n    background-image:\n      linear-gradient(135deg, #1e3a5f, #4c1d95),\n      linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);\n  }\n}\n\n/* ─── Input Theme: 3D / Elevated ──────────────────────────────────────────── */\n.otp-root[data-theme=\"elevated\"] .otp-input {\n  border-color: transparent;\n  background: #fff;\n  box-shadow:\n    0 1px 2px rgba(0,0,0,0.06),\n    0 4px 12px rgba(0,0,0,0.08);\n}\n\n.otp-root[data-theme=\"elevated\"] .otp-input--focused {\n  transform: translateY(-2px);\n  box-shadow:\n    0 4px 6px rgba(59, 130, 246, 0.1),\n    0 12px 24px rgba(59, 130, 246, 0.18),\n    0 0 0 2px var(--otp-focus-color);\n}\n\n@media (prefers-color-scheme: dark) {\n  .otp-root[data-theme=\"elevated\"] .otp-input { background: #1e293b; }\n}\n\n/* ─── High contrast (prefers-contrast: more) ─────────────────────────────── */\n@media (prefers-contrast: more) {\n  .otp-input {\n    border-width: 3px;\n  }\n  .otp-input--focused {\n    outline: 3px solid var(--otp-focus-color);\n    outline-offset: 2px;\n  }\n}\n\n/* ─── Reduced motion ──────────────────────────────────────────────────────── */\n@media (prefers-reduced-motion: reduce) {\n  .otp-input,\n  .otp-timer-progress-bar,\n  .otp-paste-suggestion,\n  .otp-toast {\n    transition: none !important;\n    animation: none !important;\n  }\n}\n\n/* ═══════════════════════════════════════════════════════════════════════════\n   TOAST NOTIFICATIONS\n   ═══════════════════════════════════════════════════════════════════════════ */\n\n:root {\n  --otp-toast-bg:           #ffffff;\n  --otp-toast-text:         #0f172a;\n  --otp-toast-muted:        #64748b;\n  --otp-toast-border:       #e2e8f0;\n  --otp-toast-radius:       12px;\n  --otp-toast-padding:      14px 16px;\n  --otp-toast-min-width:    300px;\n  --otp-toast-max-width:    420px;\n  --otp-toast-gap:          12px;\n  --otp-toast-shadow:       0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 10px -2px rgba(0,0,0,0.06);\n  --otp-toast-z:            10000;\n\n  /* Type colors */\n  --otp-toast-success-bg:   #ecfdf5;\n  --otp-toast-success-fg:   #065f46;\n  --otp-toast-success-bar:  #10b981;\n  --otp-toast-success-icon: #10b981;\n\n  --otp-toast-error-bg:     #fef2f2;\n  --otp-toast-error-fg:     #991b1b;\n  --otp-toast-error-bar:    #ef4444;\n  --otp-toast-error-icon:   #ef4444;\n\n  --otp-toast-warning-bg:   #fffbeb;\n  --otp-toast-warning-fg:   #92400e;\n  --otp-toast-warning-bar:  #f59e0b;\n  --otp-toast-warning-icon: #f59e0b;\n\n  --otp-toast-info-bg:      #eff6ff;\n  --otp-toast-info-fg:      #1e40af;\n  --otp-toast-info-bar:     #3b82f6;\n  --otp-toast-info-icon:    #3b82f6;\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --otp-toast-bg:        #1e293b;\n    --otp-toast-text:      #f1f5f9;\n    --otp-toast-muted:     #94a3b8;\n    --otp-toast-border:    #334155;\n    --otp-toast-shadow:    0 10px 25px -5px rgba(0,0,0,0.5), 0 4px 10px -2px rgba(0,0,0,0.3);\n\n    --otp-toast-success-bg: #022c22;\n    --otp-toast-success-fg: #6ee7b7;\n    --otp-toast-error-bg:   #2a0a0a;\n    --otp-toast-error-fg:   #fca5a5;\n    --otp-toast-warning-bg: #2a1a05;\n    --otp-toast-warning-fg: #fcd34d;\n    --otp-toast-info-bg:    #0f1e3d;\n    --otp-toast-info-fg:    #93c5fd;\n  }\n}\n\n/* ── Toast container (stack) ── */\n.otp-toast-container {\n  position: fixed;\n  z-index: var(--otp-toast-z);\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 16px;\n  pointer-events: none;\n  max-width: calc(100% - 32px);\n}\n\n.otp-toast-container > * { pointer-events: auto; }\n\n.otp-toast-container--top-left     { top: 0; left: 0; align-items: flex-start; }\n.otp-toast-container--top-center   { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }\n.otp-toast-container--top-right    { top: 0; right: 0; align-items: flex-end; }\n.otp-toast-container--bottom-left  { bottom: 0; left: 0; align-items: flex-start; flex-direction: column-reverse; }\n.otp-toast-container--bottom-center{ bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; flex-direction: column-reverse; }\n.otp-toast-container--bottom-right { bottom: 0; right: 0; align-items: flex-end; flex-direction: column-reverse; }\n\n[dir=\"rtl\"].otp-toast-container--top-left,\n[dir=\"rtl\"].otp-toast-container--bottom-left { left: auto; right: 0; align-items: flex-end; }\n\n[dir=\"rtl\"].otp-toast-container--top-right,\n[dir=\"rtl\"].otp-toast-container--bottom-right { right: auto; left: 0; align-items: flex-start; }\n\n/* ── Base toast ── */\n.otp-toast {\n  display: flex;\n  align-items: flex-start;\n  gap: var(--otp-toast-gap);\n  min-width: var(--otp-toast-min-width);\n  max-width: var(--otp-toast-max-width);\n  padding: var(--otp-toast-padding);\n  background: var(--otp-toast-bg);\n  color: var(--otp-toast-text);\n  border-radius: var(--otp-toast-radius);\n  border: 1px solid var(--otp-toast-border);\n  box-shadow: var(--otp-toast-shadow);\n  position: relative;\n  overflow: hidden;\n  font-size: 0.9rem;\n  line-height: 1.45;\n  opacity: 0;\n  transform: translateY(-12px) scale(0.97);\n  transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n\n.otp-toast-container--bottom-left .otp-toast,\n.otp-toast-container--bottom-center .otp-toast,\n.otp-toast-container--bottom-right .otp-toast {\n  transform: translateY(12px) scale(0.97);\n}\n\n.otp-toast--visible {\n  opacity: 1;\n  transform: translateY(0) scale(1);\n}\n\n.otp-toast--leaving {\n  opacity: 0;\n  transform: translateX(40px) scale(0.95);\n}\n\n[dir=\"rtl\"] .otp-toast--leaving { transform: translateX(-40px) scale(0.95); }\n\n.otp-toast-icon {\n  flex-shrink: 0;\n  width: 22px;\n  height: 22px;\n  border-radius: 50%;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  font-size: 0.78rem;\n  font-weight: 800;\n  color: #fff;\n  margin-top: 1px;\n}\n\n.otp-toast-body { flex: 1; min-width: 0; }\n.otp-toast-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 2px; }\n.otp-toast-message { font-size: 0.875rem; word-break: break-word; }\n\n.otp-toast-actions { display: flex; gap: 8px; margin-top: 8px; }\n\n.otp-toast-action {\n  background: transparent;\n  border: 1px solid currentColor;\n  color: inherit;\n  padding: 4px 10px;\n  border-radius: 6px;\n  font-size: 0.78rem;\n  font-weight: 600;\n  cursor: pointer;\n  opacity: 0.85;\n  transition: opacity 0.15s, background 0.15s;\n}\n.otp-toast-action:hover { opacity: 1; background: rgba(0,0,0,0.05); }\n\n.otp-toast-close {\n  background: transparent;\n  border: none;\n  color: var(--otp-toast-muted);\n  font-size: 1.25rem;\n  line-height: 1;\n  cursor: pointer;\n  padding: 0;\n  width: 22px;\n  height: 22px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 4px;\n  flex-shrink: 0;\n  margin-top: -2px;\n  transition: background 0.15s, color 0.15s;\n}\n.otp-toast-close:hover { background: rgba(0,0,0,0.06); color: var(--otp-toast-text); }\n\n.otp-toast-progress {\n  position: absolute;\n  bottom: 0;\n  inset-inline: 0;\n  height: 3px;\n  background: rgba(0,0,0,0.06);\n}\n\n.otp-toast-progress-bar {\n  height: 100%;\n  width: 100%;\n  background: currentColor;\n  transition: width linear;\n}\n\n/* ── Type variants ── */\n.otp-toast--success { background: var(--otp-toast-success-bg); color: var(--otp-toast-success-fg); border-color: rgba(16,185,129,0.25); }\n.otp-toast--success .otp-toast-icon          { background: var(--otp-toast-success-icon); }\n.otp-toast--success .otp-toast-progress-bar  { background: var(--otp-toast-success-bar); }\n\n.otp-toast--error { background: var(--otp-toast-error-bg); color: var(--otp-toast-error-fg); border-color: rgba(239,68,68,0.3); }\n.otp-toast--error .otp-toast-icon          { background: var(--otp-toast-error-icon); }\n.otp-toast--error .otp-toast-progress-bar  { background: var(--otp-toast-error-bar); }\n.otp-toast--error                          { animation: otpToastErrorPulse 0.4s ease; }\n\n.otp-toast--warning { background: var(--otp-toast-warning-bg); color: var(--otp-toast-warning-fg); border-color: rgba(245,158,11,0.3); }\n.otp-toast--warning .otp-toast-icon          { background: var(--otp-toast-warning-icon); }\n.otp-toast--warning .otp-toast-progress-bar  { background: var(--otp-toast-warning-bar); }\n\n.otp-toast--info { background: var(--otp-toast-info-bg); color: var(--otp-toast-info-fg); border-color: rgba(59,130,246,0.25); }\n.otp-toast--info .otp-toast-icon          { background: var(--otp-toast-info-icon); }\n.otp-toast--info .otp-toast-progress-bar  { background: var(--otp-toast-info-bar); }\n\n@keyframes otpToastErrorPulse {\n  0%   { box-shadow: var(--otp-toast-shadow), 0 0 0 0 rgba(239,68,68,0.5); }\n  50%  { box-shadow: var(--otp-toast-shadow), 0 0 0 8px rgba(239,68,68,0); }\n  100% { box-shadow: var(--otp-toast-shadow), 0 0 0 0 rgba(239,68,68,0); }\n}\n\n/* ───── Toast theme: Glass (frosted) ─────────────────────────────────────── */\n.otp-toast--theme-glass {\n  background: rgba(255, 255, 255, 0.72);\n  -webkit-backdrop-filter: blur(14px) saturate(1.6);\n  backdrop-filter: blur(14px) saturate(1.6);\n  border: 1px solid rgba(255,255,255,0.5);\n  box-shadow:\n    0 8px 32px rgba(0,0,0,0.12),\n    inset 0 1px 0 rgba(255,255,255,0.6);\n}\n\n@media (prefers-color-scheme: dark) {\n  .otp-toast--theme-glass {\n    background: rgba(30, 41, 59, 0.65);\n    border: 1px solid rgba(255,255,255,0.08);\n    box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);\n  }\n}\n\n.otp-toast--theme-glass.otp-toast--success { background: rgba(236, 253, 245, 0.72); }\n.otp-toast--theme-glass.otp-toast--error   { background: rgba(254, 242, 242, 0.72); }\n.otp-toast--theme-glass.otp-toast--warning { background: rgba(255, 251, 235, 0.72); }\n.otp-toast--theme-glass.otp-toast--info    { background: rgba(239, 246, 255, 0.72); }\n\n/* ───── Toast theme: Solid (high contrast) ───────────────────────────────── */\n.otp-toast--theme-solid           { color: #fff; border: none; }\n.otp-toast--theme-solid .otp-toast-close { color: rgba(255,255,255,0.85); }\n.otp-toast--theme-solid .otp-toast-close:hover { background: rgba(255,255,255,0.15); color:#fff; }\n.otp-toast--theme-solid .otp-toast-icon  { background: rgba(255,255,255,0.22); color:#fff; }\n.otp-toast--theme-solid.otp-toast--success { background: #10b981; }\n.otp-toast--theme-solid.otp-toast--error   { background: #ef4444; }\n.otp-toast--theme-solid.otp-toast--warning { background: #f59e0b; }\n.otp-toast--theme-solid.otp-toast--info    { background: #3b82f6; }\n.otp-toast--theme-solid .otp-toast-progress-bar { background: rgba(255,255,255,0.5); }\n\n/* ───── Toast theme: Gradient ────────────────────────────────────────────── */\n.otp-toast--theme-gradient        { color: #fff; border: none; box-shadow: 0 12px 30px -8px rgba(0,0,0,0.35); }\n.otp-toast--theme-gradient .otp-toast-icon  { background: rgba(255,255,255,0.25); }\n.otp-toast--theme-gradient .otp-toast-close { color: rgba(255,255,255,0.9); }\n.otp-toast--theme-gradient.otp-toast--success { background: linear-gradient(135deg, #10b981, #059669); }\n.otp-toast--theme-gradient.otp-toast--error   { background: linear-gradient(135deg, #ef4444, #b91c1c); }\n.otp-toast--theme-gradient.otp-toast--warning { background: linear-gradient(135deg, #f59e0b, #d97706); }\n.otp-toast--theme-gradient.otp-toast--info    { background: linear-gradient(135deg, #3b82f6, #6366f1); }\n.otp-toast--theme-gradient .otp-toast-progress-bar { background: rgba(255,255,255,0.5); }\n\n/* ───── Toast theme: Minimal (left accent stripe) ────────────────────────── */\n.otp-toast--theme-minimal {\n  background: var(--otp-toast-bg);\n  color: var(--otp-toast-text);\n  border: 1px solid var(--otp-toast-border);\n  border-inline-start-width: 4px;\n  box-shadow: 0 4px 12px rgba(0,0,0,0.06);\n}\n\n.otp-toast--theme-minimal .otp-toast-icon          { background: transparent; color: currentColor; }\n.otp-toast--theme-minimal.otp-toast--success       { border-inline-start-color: var(--otp-toast-success-bar); }\n.otp-toast--theme-minimal.otp-toast--success .otp-toast-icon { color: var(--otp-toast-success-icon); }\n.otp-toast--theme-minimal.otp-toast--error         { border-inline-start-color: var(--otp-toast-error-bar); }\n.otp-toast--theme-minimal.otp-toast--error .otp-toast-icon   { color: var(--otp-toast-error-icon); }\n.otp-toast--theme-minimal.otp-toast--warning       { border-inline-start-color: var(--otp-toast-warning-bar); }\n.otp-toast--theme-minimal.otp-toast--warning .otp-toast-icon { color: var(--otp-toast-warning-icon); }\n.otp-toast--theme-minimal.otp-toast--info          { border-inline-start-color: var(--otp-toast-info-bar); }\n.otp-toast--theme-minimal.otp-toast--info .otp-toast-icon    { color: var(--otp-toast-info-icon); }\n\n/* ───── Toast theme: Pill (compact, rounded) ────────────────────────────── */\n.otp-toast--theme-pill {\n  border-radius: 999px;\n  padding: 8px 16px 8px 10px;\n  min-width: auto;\n  font-size: 0.85rem;\n  gap: 8px;\n  border: none;\n  background: var(--otp-toast-bg);\n}\n\n.otp-toast--theme-pill .otp-toast-icon {\n  width: 24px; height: 24px;\n}\n\n.otp-toast--theme-pill .otp-toast-close { display: none; }\n.otp-toast--theme-pill .otp-toast-progress { display: none; }\n.otp-toast--theme-pill .otp-toast-title { display: none; }\n\n.otp-toast--theme-pill.otp-toast--success { background: #10b981; color: #fff; }\n.otp-toast--theme-pill.otp-toast--error   { background: #ef4444; color: #fff; }\n.otp-toast--theme-pill.otp-toast--warning { background: #f59e0b; color: #fff; }\n.otp-toast--theme-pill.otp-toast--info    { background: #3b82f6; color: #fff; }\n.otp-toast--theme-pill .otp-toast-icon    { background: rgba(255,255,255,0.25); }\n\n/* ─── Mobile responsive ── */\n@media (max-width: 480px) {\n  .otp-toast-container {\n    inset-inline: 0 !important;\n    left: 0 !important; right: 0 !important; transform: none !important;\n    align-items: stretch !important;\n    padding: 10px;\n  }\n  .otp-toast {\n    min-width: 0;\n    max-width: 100%;\n    width: 100%;\n  }\n}\n";
if (typeof document !== 'undefined') {
  const __id = 'otp-input-styles';
  if (!document.getElementById(__id)) {
    const s = document.createElement('style');
    s.id = __id;
    s.textContent = __css;
    document.head.appendChild(s);
  }
}

/**
 * Lightweight event emitter for internal pub/sub
 */
class EventEmitter {
  constructor() {
    this._events = Object.create(null);
  }

  on(event, listener) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(l => l !== listener);
  }

  emit(event, ...args) {
    if (!this._events[event]) return;
    this._events[event].forEach(l => {
      try { l(...args); } catch (e) { console.error(`[OTPInput] Event listener error on "${event}":`, e); }
    });
  }

  once(event, listener) {
    const remove = this.on(event, (...args) => {
      remove();
      listener(...args);
    });
    return remove;
  }

  removeAllListeners(event) {
    if (event) delete this._events[event];
    else this._events = Object.create(null);
  }
}

/**
 * General utility helpers
 */

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return mergeDeep(target, ...sources);
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function isFunction(val) {
  return typeof val === 'function';
}

function generateId(prefix = 'otp') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * DOM utility helpers
 */

function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') el.className = val;
    else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
    else if (key.startsWith('data-')) el.setAttribute(key, val);
    else if (key.startsWith('aria-')) el.setAttribute(key, val);
    else el[key] = val;
  }
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else if (child instanceof Node) el.appendChild(child);
  });
  return el;
}

function addClasses(el, ...classes) {
  el.classList.add(...classes.filter(Boolean));
}

function removeClasses(el, ...classes) {
  el.classList.remove(...classes.filter(Boolean));
}

function getDir(el) {
  let node = el;
  while (node && node !== document.documentElement) {
    const dir = node.getAttribute('dir') || getComputedStyle(node).direction;
    if (dir === 'rtl' || dir === 'ltr') return dir;
    node = node.parentElement;
  }
  return document.dir || 'ltr';
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Manages ARIA attributes, live regions, and screen reader announcements.
 */
class AccessibilityManager {
  constructor(instance) {
    this.instance = instance;
    this._liveRegion = null;
    this._instanceId = generateId('otp');
  }

  setup(container, inputs) {
    const { length, label, describedBy } = this.instance.options;

    // Container role
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', label || `Enter ${length}-digit code`);

    // Create visually-hidden live region for announcements
    this._liveRegion = document.createElement('div');
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.setAttribute('aria-atomic', 'true');
    this._liveRegion.className = 'otp-live-region';
    this._liveRegion.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    container.appendChild(this._liveRegion);

    // Set up each input
    inputs.forEach((input, i) => {
      const inputId = `${this._instanceId}-input-${i}`;
      input.id = inputId;
      input.setAttribute('aria-label', `Digit ${i + 1} of ${length}`);
      input.setAttribute('role', 'textbox');
      input.setAttribute('aria-required', 'true');
      if (describedBy) input.setAttribute('aria-describedby', describedBy);
    });
  }

  updateInputState(input, { filled, error, disabled }) {
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
    input.disabled = !!disabled;
  }

  announce(message, priority = 'polite') {
    if (!this._liveRegion) return;
    this._liveRegion.setAttribute('aria-live', priority);
    // Clear and re-set to force announcement
    this._liveRegion.textContent = '';
    requestAnimationFrame(() => {
      this._liveRegion.textContent = message;
    });
  }

  announceCompletion(value) {
    this.announce(`OTP complete: ${value.split('').join(' ')}`, 'assertive');
  }

  announceError(message) {
    this.announce(message, 'assertive');
  }

  announceTimer(seconds) {
    if (seconds % 10 === 0 || seconds <= 5) {
      this.announce(`${seconds} seconds remaining`);
    }
  }

  announceResend() {
    this.announce('New code sent. Please enter the new code.');
  }

  destroy() {
    this._liveRegion?.remove();
    this._liveRegion = null;
  }
}

/**
 * Input validation utilities
 */

const PATTERNS = {
  numeric: /^\d$/,
  alpha: /^[a-zA-Z]$/,
  alphanumeric: /^[a-zA-Z0-9]$/,
  hex: /^[0-9a-fA-F]$/,
};

function createValidator(type, customPattern) {
  if (customPattern instanceof RegExp) return (ch) => customPattern.test(ch);
  return (ch) => (PATTERNS[type] || PATTERNS.numeric).test(ch);
}

function isOTPLike(text) {
  // Detect if clipboard text looks like an OTP (4-8 consecutive digits/alphanums)
  const stripped = text.trim();
  return /^\d{4,8}$/.test(stripped) || /^[A-Z0-9]{4,8}$/.test(stripped);
}

function extractOTP(text, length, pattern) {
  // Try to extract OTP from various formats: "Your OTP is 123456", SMS templates, etc.
  const stripped = text.replace(/\s/g, '');

  // Pure digit sequence of correct length
  const exactMatch = new RegExp(`\\b\\d{${length}}\\b`).exec(text);
  if (exactMatch) return exactMatch[0];

  // Alphanumeric sequence
  const alphaMatch = new RegExp(`\\b[A-Z0-9]{${length}}\\b`).exec(text.toUpperCase());
  if (alphaMatch) return alphaMatch[0];

  // Take first N valid characters
  const valid = stripped.split('').filter(ch => (pattern || /\d/).test(ch));
  if (valid.length >= length) return valid.slice(0, length).join('');

  return null;
}

/**
 * Manages per-digit and full-OTP validation, error state, and feedback.
 */
class ValidationManager {
  constructor(instance) {
    this.instance = instance;
    this._validator = null;
    this._errors = [];
    this._rebuild();
  }

  _rebuild() {
    const { type, pattern } = this.instance.options;
    this._validator = createValidator(type, pattern);
  }

  isValidChar(ch) {
    return this._validator(ch);
  }

  validateAll(values) {
    const opts = this.instance.options;
    this._errors = [];

    values.forEach((val, i) => {
      if (val && !this._validator(val)) {
        this._errors.push({ index: i, message: `Invalid character at position ${i + 1}` });
      }
    });

    if (opts.validate && typeof opts.validate === 'function') {
      const joined = values.join('');
      const customError = opts.validate(joined);
      if (customError) this._errors.push({ index: -1, message: customError });
    }

    return this._errors.length === 0;
  }

  markErrors(inputs) {
    inputs.forEach((input, i) => {
      const hasError = this._errors.some(e => e.index === i || e.index === -1);
      toggleError(input, hasError);
    });
    return this._errors;
  }

  clearErrors(inputs) {
    inputs.forEach(input => toggleError(input, false));
    this._errors = [];
  }

  getErrors() {
    return [...this._errors];
  }
}

function toggleError(input, hasError) {
  if (hasError) {
    addClasses(input, 'otp-input--error');
    input.setAttribute('aria-invalid', 'true');
  } else {
    removeClasses(input, 'otp-input--error');
    input.setAttribute('aria-invalid', 'false');
  }
}

/**
 * Undo/redo history for OTP input values.
 * Stores snapshots of the values array.
 */
class HistoryManager {
  constructor(maxSize = 50) {
    this._stack = [];
    this._pointer = -1;
    this._maxSize = maxSize;
  }

  push(snapshot) {
    // Drop any redo states when new action taken
    this._stack = this._stack.slice(0, this._pointer + 1);
    this._stack.push([...snapshot]);
    if (this._stack.length > this._maxSize) this._stack.shift();
    this._pointer = this._stack.length - 1;
  }

  undo() {
    if (this._pointer <= 0) return null;
    this._pointer--;
    return [...this._stack[this._pointer]];
  }

  redo() {
    if (this._pointer >= this._stack.length - 1) return null;
    this._pointer++;
    return [...this._stack[this._pointer]];
  }

  canUndo() {
    return this._pointer > 0;
  }

  canRedo() {
    return this._pointer < this._stack.length - 1;
  }

  clear() {
    this._stack = [];
    this._pointer = -1;
  }

  /** Push only if state changed */
  pushIfChanged(snapshot) {
    const current = this._stack[this._pointer];
    if (!current || !arraysEqual(current, snapshot)) {
      this.push(snapshot);
    }
  }
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Handles paste events and clipboard OTP detection with suggestion UI.
 */
class ClipboardManager {
  constructor(instance) {
    this.instance = instance;
    this._suggestionEl = null;
    this._suggestionTimer = null;
  }

  handlePaste(e, targetIndex) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    this._distribute(text, targetIndex);
  }

  _distribute(text, startIdx) {
    const inst = this.instance;
    const { length, type, pattern } = inst.options;
    const extracted = extractOTP(text, length, inst.validation._validator);

    if (!extracted) return;

    const chars = extracted.split('');
    chars.forEach((ch, i) => {
      const logicalIdx = startIdx + i;
      if (logicalIdx < inst.inputs.length && inst.validation.isValidChar(ch)) {
        inst._setInputValue(logicalIdx, ch);
      }
    });

    // Focus last filled or last input
    const lastIdx = Math.min(startIdx + chars.length - 1, inst.inputs.length - 1);
    inst._focusIndex(lastIdx + 1 < inst.inputs.length ? lastIdx + 1 : lastIdx);
    inst._notifyChange();
    inst._checkCompletion();
  }

  /** Poll clipboard (with permission) and suggest pasting if OTP-like text is found */
  async checkClipboard() {
    if (!navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      const { length } = this.instance.options;
      if (isOTPLike(text) || extractOTP(text, length)) {
        this._showSuggestion(text);
      }
    } catch (_) {
      // Permission denied or not available — silently ignore
    }
  }

  _showSuggestion(text) {
    const inst = this.instance;
    if (!inst.options.clipboardDetection) return;
    this._hideSuggestion();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'otp-paste-suggestion';
    btn.setAttribute('aria-label', 'Paste detected OTP from clipboard');
    btn.textContent = inst.options.clipboardSuggestionText || 'Paste code from clipboard';

    btn.addEventListener('click', () => {
      this._distribute(text, 0);
      this._hideSuggestion();
    });

    inst._wrapper.appendChild(btn);
    this._suggestionEl = btn;

    // Auto-hide after 8s
    this._suggestionTimer = setTimeout(() => this._hideSuggestion(), 18000);
  }

  _hideSuggestion() {
    clearTimeout(this._suggestionTimer);
    this._suggestionEl?.remove();
    this._suggestionEl = null;
  }

  destroy() {
    this._hideSuggestion();
  }
}

/**
 * Manages countdown timer UI, expiry callbacks, and resend cooldown.
 */
class TimerManager {
  constructor(instance) {
    this.instance = instance;
    this._timerEl = null;
    this._progressEl = null;
    this._progressBar = null;
    this._resendBtn = null;
    this._interval = null;
    this._remaining = 0;
    this._total = 0;
  }

  buildUI(wrapperEl) {
    const { timer, resend } = this.instance.options;

    if (timer?.enabled || resend?.enabled) {
      const footer = document.createElement('div');
      footer.className = 'otp-footer';

      if (timer?.enabled) {
        const timerWrap = document.createElement('div');
        timerWrap.className = 'otp-timer-wrap';

        if (timer.showProgress) {
          this._progressEl = document.createElement('div');
          this._progressEl.className = 'otp-timer-progress';
          this._progressBar = document.createElement('div');
          this._progressBar.className = 'otp-timer-progress-bar';
          this._progressEl.appendChild(this._progressBar);
          wrapperEl.insertBefore(this._progressEl, wrapperEl.querySelector('.otp-inputs-row'));
        }

        this._timerEl = document.createElement('span');
        this._timerEl.className = 'otp-timer';
        this._timerEl.setAttribute('aria-live', 'off');
        timerWrap.appendChild(this._timerEl);
        footer.appendChild(timerWrap);
      }

      if (resend?.enabled) {
        this._resendBtn = document.createElement('button');
        this._resendBtn.type = 'button';
        this._resendBtn.className = 'otp-resend-btn';
        this._resendBtn.textContent = resend.label || 'Resend code';
        this._resendBtn.disabled = true;
        this._resendBtn.addEventListener('click', () => this._handleResend());
        footer.appendChild(this._resendBtn);
      }

      wrapperEl.appendChild(footer);
    }
  }

  start(durationSeconds) {
    this.stop();
    this._total = durationSeconds;
    this._remaining = durationSeconds;

    if (this._progressBar) {
      this._progressBar.classList.remove('otp-timer-progress-bar--running');
      this._progressBar.style.animationDuration = '';
      // Force reflow so removing the class takes effect before re-adding
      void this._progressBar.offsetWidth;
      this._progressBar.style.animationDuration = `${durationSeconds}s`;
      this._progressBar.classList.add('otp-timer-progress-bar--running');
    }

    this._tick();
    this._interval = setInterval(() => this._tick(), 1000);

    if (!this._visibilityHandler) {
      this._visibilityHandler = () => {
        if (document.hidden) {
          clearInterval(this._interval);
          this._interval = null;
        } else if (this._remaining > 0) {
          this._interval = setInterval(() => this._tick(), 1000);
        }
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }
  }

  _tick() {
    const inst = this.instance;
    const { timer, resend } = inst.options;

    this._updateDisplay();
    inst.a11y.announceTimer(this._remaining);

    if (this._remaining <= 0) {
      this.stop();
      if (timer?.onExpire) timer.onExpire();
      inst.emitter.emit('expire');
      inst._setExpired(true);
      if (this._resendBtn) this._resendBtn.disabled = false;
      return;
    }
    this._remaining--;
  }

  _updateDisplay() {
    if (this._timerEl) {
      this._timerEl.textContent = formatTime(this._remaining);
      if (this._remaining <= 10) {
        this._timerEl.classList.add('otp-timer--urgent');
      }
    }
  }

  _handleResend() {
    const inst = this.instance;
    const { resend, timer } = inst.options;

    inst._setExpired(false);
    inst.clear();
    this._resendBtn.disabled = true;

    const cooldown = resend.cooldown ?? timer?.duration ?? 30;
    this.start(cooldown);

    if (resend.onResend) resend.onResend();
    inst.emitter.emit('resend');
    inst.a11y.announceResend();
  }

  stop() {
    clearInterval(this._interval);
    this._interval = null;
    if (this._progressBar) {
      this._progressBar.classList.remove('otp-timer-progress-bar--running');
    }
  }

  reset(durationSeconds) {
    this.stop();
    this._timerEl?.classList.remove('otp-timer--urgent');
    if (this._resendBtn) this._resendBtn.disabled = true;
    this.start(durationSeconds ?? this._total);
  }

  destroy() {
    this.stop();
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }
}

/**
 * Toast notification manager
 *
 * Renders animated success/error/info/warning toasts in a stacking container.
 * One container is shared per page (per position). Auto-dismiss with progress bar.
 */

const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

// Shared container registry — one per (position + dir)
const _containers = new Map();

function getContainer(position, dir) {
  const key = `${position}|${dir}`;
  let el = _containers.get(key);
  if (el && document.body.contains(el)) return el;

  el = document.createElement('div');
  el.className = `otp-toast-container otp-toast-container--${position}`;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', 'Notifications');
  el.setAttribute('dir', dir);
  document.body.appendChild(el);
  _containers.set(key, el);
  return el;
}

class ToastManager {
  /**
   * @param {object} options
   * @param {'top-left'|'top-center'|'top-right'|'bottom-left'|'bottom-center'|'bottom-right'} [options.position]
   * @param {'default'|'glass'|'solid'|'gradient'|'minimal'|'pill'} [options.theme]
   * @param {'ltr'|'rtl'} [options.dir]
   * @param {number} [options.duration]
   */
  constructor(options = {}) {
    this.options = {
      position: 'top-right',
      theme: 'default',
      duration: 3500,
      dir: 'ltr',
      pauseOnHover: true,
      closeButton: true,
      ...options,
    };
    if (!POSITIONS.includes(this.options.position)) this.options.position = 'top-right';
  }

  setDirection(dir) { this.options.dir = dir; }
  setTheme(theme)   { this.options.theme = theme; }

  success(message, opts) { return this.show({ type: 'success', message, ...opts }); }
  error(message, opts)   { return this.show({ type: 'error',   message, ...opts }); }
  warning(message, opts) { return this.show({ type: 'warning', message, ...opts }); }
  info(message, opts)    { return this.show({ type: 'info',    message, ...opts }); }

  /**
   * @param {object} cfg
   * @param {'success'|'error'|'warning'|'info'} cfg.type
   * @param {string} cfg.message
   * @param {string} [cfg.title]
   * @param {number} [cfg.duration]
   * @param {string} [cfg.theme]
   * @param {string} [cfg.icon]
   * @param {Array<{label: string, onClick: function}>} [cfg.actions]
   */
  show(cfg) {
    const { type = 'info', message, title, duration, theme, icon, actions = [] } = cfg;
    const finalTheme = theme || this.options.theme;
    const finalDuration = duration ?? this.options.duration;

    const container = getContainer(this.options.position, this.options.dir);
    container.setAttribute('dir', this.options.dir);

    const toast = document.createElement('div');
    toast.className = [
      'otp-toast',
      `otp-toast--${type}`,
      `otp-toast--theme-${finalTheme}`,
    ].join(' ');
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    // Icon
    const iconEl = document.createElement('span');
    iconEl.className = 'otp-toast-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon || ICONS[type] || '';

    // Body
    const body = document.createElement('div');
    body.className = 'otp-toast-body';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'otp-toast-title';
      titleEl.textContent = title;
      body.appendChild(titleEl);
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'otp-toast-message';
    msgEl.textContent = message;
    body.appendChild(msgEl);

    // Actions
    if (actions.length) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'otp-toast-actions';
      actions.forEach(a => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'otp-toast-action';
        btn.textContent = a.label;
        btn.addEventListener('click', () => {
          a.onClick?.();
          this._dismiss(toast);
        });
        actionsEl.appendChild(btn);
      });
      body.appendChild(actionsEl);
    }

    // Close button
    let closeBtn;
    if (this.options.closeButton) {
      closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'otp-toast-close';
      closeBtn.setAttribute('aria-label', 'Close notification');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => this._dismiss(toast));
    }

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'otp-toast-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'otp-toast-progress-bar';
    progress.appendChild(progressBar);

    toast.appendChild(iconEl);
    toast.appendChild(body);
    if (closeBtn) toast.appendChild(closeBtn);
    if (finalDuration > 0) toast.appendChild(progress);

    // Insert at top for top-* positions, bottom for bottom-* (visual stacking)
    if (this.options.position.startsWith('top')) {
      container.insertBefore(toast, container.firstChild);
    } else {
      container.appendChild(toast);
    }

    // Trigger entrance animation on next frame
    requestAnimationFrame(() => toast.classList.add('otp-toast--visible'));

    // Auto-dismiss
    let dismissTimer;
    let progressStart;
    let remaining = finalDuration;

    const startTimer = () => {
      if (finalDuration <= 0) return;
      progressStart = Date.now();
      progressBar.style.transition = `width ${remaining}ms linear`;
      requestAnimationFrame(() => { progressBar.style.width = '0%'; });
      dismissTimer = setTimeout(() => this._dismiss(toast), remaining);
    };

    const pauseTimer = () => {
      if (!dismissTimer) return;
      clearTimeout(dismissTimer);
      dismissTimer = null;
      remaining -= Date.now() - progressStart;
      const computed = getComputedStyle(progressBar).width;
      progressBar.style.transition = 'none';
      progressBar.style.width = computed;
    };

    if (this.options.pauseOnHover && finalDuration > 0) {
      toast.addEventListener('mouseenter', pauseTimer);
      toast.addEventListener('mouseleave', startTimer);
      toast.addEventListener('focusin',    pauseTimer);
      toast.addEventListener('focusout',   startTimer);
    }

    startTimer();

    return {
      element: toast,
      dismiss: () => this._dismiss(toast),
    };
  }

  _dismiss(toast) {
    if (!toast || toast.dataset.dismissed) return;
    toast.dataset.dismissed = '1';
    toast.classList.remove('otp-toast--visible');
    toast.classList.add('otp-toast--leaving');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback removal in case transitionend doesn't fire
    setTimeout(() => toast.remove(), 500);
  }

  /** Clear all toasts in this manager's container */
  clear() {
    const container = _containers.get(`${this.options.position}|${this.options.dir}`);
    if (!container) return;
    container.querySelectorAll('.otp-toast').forEach(t => this._dismiss(t));
  }
}

/** Singleton helper for global access */
let _defaultInstance;
function getDefaultToast() {
  if (!_defaultInstance) _defaultInstance = new ToastManager();
  return _defaultInstance;
}

/**
 * Locale definitions for number rendering and RTL detection
 */

const RTL_LOCALES = new Set([
  'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi',
]);

const NUMERAL_SYSTEMS = {
  // Western Arabic (default)
  en: { digits: '0123456789', dir: 'ltr' },
  // Eastern Arabic
  ar: { digits: '٠١٢٣٤٥٦٧٨٩', dir: 'rtl' },
  // Persian/Farsi
  fa: { digits: '۰۱۲۳۴۵۶۷۸۹', dir: 'rtl' },
  // Hindi/Devanagari
  hi: { digits: '०१२३४५६७८९', dir: 'ltr' },
  // Bengali
  bn: { digits: '০১২৩৪৫৬৭৮৯', dir: 'ltr' },
  // Tamil
  ta: { digits: '௦௧௨௩௪௫௬௭௮௯', dir: 'ltr' },
  // Thai
  th: { digits: '๐๑๒๓๔๕๖๗๘๙', dir: 'ltr' },
};

function isRTLLocale(locale) {
  if (!locale) return false;
  const base = locale.split('-')[0].toLowerCase();
  return RTL_LOCALES.has(base);
}

function getNumeralSystem(locale) {
  if (!locale) return NUMERAL_SYSTEMS.en;
  const base = locale.split('-')[0].toLowerCase();
  return NUMERAL_SYSTEMS[base] || NUMERAL_SYSTEMS.en;
}

/**
 * Manages RTL layout, navigation direction, and mirrored animations.
 */
class RTLManager {
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

/**
 * Handles rendering digits in locale-specific numeral systems
 * while storing values internally as Western digits (0-9).
 */
class NumberRenderer {
  constructor(locale = 'en') {
    this.setLocale(locale);
  }

  setLocale(locale) {
    this.locale = locale;
    this.system = getNumeralSystem(locale);
  }

  /** Convert Western digit to locale numeral */
  toLocale(westernChar) {
    if (!westernChar || westernChar.length !== 1) return westernChar;
    const idx = '0123456789'.indexOf(westernChar);
    if (idx === -1) return westernChar; // non-digit, return as-is
    return this.system.digits[idx];
  }

  /** Convert locale numeral back to Western digit */
  toWestern(localeChar) {
    if (!localeChar || localeChar.length !== 1) return localeChar;
    const idx = this.system.digits.indexOf(localeChar);
    if (idx === -1) {
      // Already western or not a digit
      return localeChar;
    }
    return String(idx);
  }

  /** Convert a full string from locale to western */
  stringToWestern(str) {
    return str.split('').map(ch => this.toWestern(ch)).join('');
  }

  /** Convert a full string from western to locale */
  stringToLocale(str) {
    return str.split('').map(ch => this.toLocale(ch)).join('');
  }

  isNativeNumeral(ch) {
    return this.system.digits.includes(ch);
  }
}

/** @type {OTPInputOptions} */
const DEFAULT_OPTIONS = {
  length: 6,
  type: 'numeric',          // 'numeric' | 'alpha' | 'alphanumeric' | 'hex' | 'custom'
  pattern: null,             // RegExp for custom type
  secure: false,             // mask input like password
  autoFocus: true,
  autoSubmit: false,         // submit form on complete
  selectOnFocus: true,
  direction: 'auto',        // 'ltr' | 'rtl' | 'auto'
  locale: null,              // BCP 47 locale string e.g. 'ar', 'fa', 'en'
  nativeNumerals: false,     // render locale-native digits (e.g. Arabic-Indic)
  placeholder: '·',
  label: null,
  describedBy: null,
  clipboardDetection: true,
  clipboardSuggestionText: 'Paste code from clipboard',
  haptic: true,
  validate: null,            // (value: string) => string | null  (custom validator)
  animation: {
    error: 'shake',          // 'shake' | 'highlight' | 'both' | false
    success: true,
    duration: 300,
  },
  timer: {
    enabled: false,
    duration: 60,            // seconds
    showProgress: true,
    onExpire: null,
  },
  resend: {
    enabled: false,
    cooldown: 60,
    label: 'Resend code',
    onResend: null,
  },
  separator: null,           // { char: '—', after: [3] }  — visual separator between digit groups
  smsAutoRead: false,        // use Web OTP API to auto-fill from SMS (requires HTTPS + correct SMS format)
  biometric: {
    enabled: false,          // require platform biometric/PIN after OTP completion
    promptText: 'Verify your identity to continue',
    onConfirmed: null,       // () => void
    onCancelled: null,       // () => void
  },
  theme: 'default',          // 'default' | 'underline' | 'rounded' | 'ghost' | 'filled' | 'soft' | 'neon' | 'gradient' | 'pill'
  toast: {
    enabled: false,           // auto-show toast on complete/error/expire
    position: 'top-right',
    theme: 'default',         // 'default' | 'glass' | 'solid' | 'gradient' | 'minimal' | 'pill'
    duration: 3500,
    successMessage: 'Code verified successfully',
    errorMessage: 'Invalid code. Please try again.',
    expireMessage: 'Code expired. Please request a new one.',
    resendMessage: 'A new code has been sent.',
  },
  // Event callbacks (alternative to .on())
  onChange: null,
  onComplete: null,
  onError: null,
  onFocus: null,
  onBlur: null,
};

/**
 * OTPInput — main class
 *
 * @example
 * const otp = OTPInput.create('#container', { length: 6, onComplete: v => console.log(v) });
 */
class OTPInput {
  /**
   * @param {Element|string} target
   * @param {Partial<OTPInputOptions>} options
   */
  constructor(target, options = {}) {
    const container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('[OTPInput] Container element not found');

    this.container = container;
    this.options = mergeDeep({}, DEFAULT_OPTIONS, options);
    this._id = generateId('otp');
    this.inputs = [];
    this._values = Array(this.options.length).fill('');
    this._expired = false;
    this._destroyed = false;
    this._boundHandlers = {};

    // Sub-managers
    this.emitter    = new EventEmitter();
    this.rtl        = new RTLManager(this);
    this.numbers    = new NumberRenderer(this.options.locale || 'en');
    this.a11y       = new AccessibilityManager(this);
    this.validation = new ValidationManager(this);
    this.history    = new HistoryManager();
    this.clipboard  = new ClipboardManager(this);
    this.timer      = new TimerManager(this);
    this.toast      = new ToastManager({
      position: this.options.toast.position,
      theme:    this.options.toast.theme,
      duration: this.options.toast.duration,
      dir:      this.rtl.resolveDirection(),
    });

    this._build();
    this._bindOptionCallbacks();
    this._startIfNeeded();
    this._initSmsAutoRead();
  }

  // ─── Static factory ────────────────────────────────────────────────────────

  /**
   * @param {Element|string} target
   * @param {Partial<OTPInputOptions>} options
   * @returns {OTPInput}
   */
  static create(target, options = {}) {
    return new OTPInput(target, options);
  }

  // ─── Build DOM ─────────────────────────────────────────────────────────────

  _build() {
    this.container.innerHTML = '';
    addClasses(this.container, 'otp-root');
    if (this.options.theme) this.container.dataset.theme = this.options.theme;
    this.rtl.applyDirection(this.container);

    // Wrapper
    this._wrapper = createElement('div', { class: 'otp-wrapper' });
    if (this.options.secure) addClasses(this._wrapper, 'otp-wrapper--secure');

    // Inputs row
    this._inputsRow = createElement('div', {
      class: 'otp-inputs-row',
      role: 'presentation',
    });

    const { length, placeholder, secure, type } = this.options;

    for (let i = 0; i < length; i++) {
      const input = this._createInput(i);
      this._inputsRow.appendChild(input);
      this.inputs.push(input);

      // Separator after digit (i+1) if configured
      const sep = this.options.separator;
      if (sep && i < length - 1) {
        const positions = Array.isArray(sep.after) ? sep.after : (sep.after != null ? [sep.after] : [Math.floor(length / 2)]);
        if (positions.includes(i + 1)) {
          const sepEl = createElement('span', { class: 'otp-separator', 'aria-hidden': 'true' });
          sepEl.textContent = sep.char ?? '—';
          this._inputsRow.appendChild(sepEl);
        }
      }
    }

    this._wrapper.appendChild(this._inputsRow);
    this.timer.buildUI(this._wrapper);
    this.container.appendChild(this._wrapper);

    // A11y setup
    this.a11y.setup(this.container, this.inputs);

    // Initial history snapshot
    this.history.push([...this._values]);

    if (this.options.autoFocus) {
      requestAnimationFrame(() => this._focusIndex(0));
    }

    // Clipboard detection on first focus
    if (this.options.clipboardDetection) {
      this.inputs[0].addEventListener('focus', () => this.clipboard.checkClipboard(), { once: true });
    }
  }

  _createInput(index) {
    const { secure, placeholder, type, locale } = this.options;

    const input = createElement('input', {
      type: secure ? 'password' : 'text',
      inputMode: type === 'alpha' ? 'text' : (type === 'numeric' ? 'numeric' : 'text'),
      maxLength: 1,
      autocomplete: index === 0 ? 'one-time-code' : 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: false,
      class: 'otp-input',
      'data-index': index,
      placeholder: placeholder,
    });

    if (locale) input.lang = locale;

    this._bindInputEvents(input, index);
    return input;
  }

  // ─── Event Binding ─────────────────────────────────────────────────────────

  _bindInputEvents(input, index) {
    input.addEventListener('beforeinput', (e) => this._handleBeforeInput(e, index));
    input.addEventListener('input',       (e) => this._handleInput(e, index));
    input.addEventListener('keydown',     (e) => this._handleKeyDown(e, index));
    input.addEventListener('paste',       (e) => this.clipboard.handlePaste(e, index));
    input.addEventListener('focus',       (e) => this._handleFocus(e, index));
    input.addEventListener('blur',        (e) => this._handleBlur(e, index));
    input.addEventListener('click',       (e) => this._handleClick(e, index));
  }

  _bindOptionCallbacks() {
    const { onChange, onComplete, onError, onFocus, onBlur, toast } = this.options;
    if (isFunction(onChange))   this.emitter.on('change',   onChange);
    if (isFunction(onComplete)) this.emitter.on('complete', onComplete);
    if (isFunction(onError))    this.emitter.on('error',    onError);
    if (isFunction(onFocus))    this.emitter.on('focus',    onFocus);
    if (isFunction(onBlur))     this.emitter.on('blur',     onBlur);

    if (toast?.enabled) {
      this.emitter.on('expire', () => this.toast.warning(toast.expireMessage));
      this.emitter.on('resend', () => this.toast.info(toast.resendMessage));
    }
  }

  _startIfNeeded() {
    const { timer } = this.options;
    if (timer?.enabled && timer.duration > 0) {
      this.timer.start(timer.duration);
    }
  }

  // ─── Input Handlers ────────────────────────────────────────────────────────

  _handleBeforeInput(e, index) {
    // Block invalid characters early (compositionend is handled separately)
    if (e.inputType === 'insertText' && e.data) {
      const ch = this._normalize(e.data);
      if (!this.validation.isValidChar(ch)) {
        e.preventDefault();
        this._triggerError(index);
      }
    }
  }

  _handleInput(e, index) {
    const input = this.inputs[index];
    const raw = input.value;

    if (!raw) {
      this._values[index] = '';
      this._updateInputUI(input, index);
      this._notifyChange();
      return;
    }

    // Handle multi-char input (IME, autocomplete filling whole field)
    if (raw.length > 1) {
      this.clipboard._distribute(raw, index);
      return;
    }

    const ch = this._normalize(raw);

    if (!this.validation.isValidChar(ch)) {
      input.value = this._getDisplayValue(index);
      this._triggerError(index);
      return;
    }

    const display = this.options.nativeNumerals ? this.numbers.toLocale(ch) : ch;
    input.value = display;
    this._values[index] = ch;
    this.history.pushIfChanged([...this._values]);

    this._updateInputUI(input, index);
    this._haptic();
    this._notifyChange();

    // Advance to next
    const next = this.rtl.nextIndex(index, this.inputs);
    if (next !== null) this._focusIndex(next);
    else this._checkCompletion();

    if (index === this.inputs.length - 1) this._checkCompletion();
  }

  _handleKeyDown(e, index) {
    if (this._expired) return;

    switch (e.key) {
      case 'Backspace':
        this._handleBackspace(e, index);
        break;
      case 'Delete':
        this._handleDelete(e, index);
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const dir = this.rtl.arrowKeyDirection(e.key, this.rtl.isRTL);
        if (dir === 'next') { const n = this.rtl.nextIndex(index, this.inputs); if (n !== null) this._focusIndex(n); }
        else                { const p = this.rtl.prevIndex(index);              if (p !== null) this._focusIndex(p); }
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown':
        e.preventDefault();
        break;
      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.shiftKey ? this._redo() : this._undo();
        }
        break;
      case 'a':
      case 'A':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this._selectAll();
        }
        break;
      case 'Tab':
        // Allow default tab behavior
        break;
      case 'Enter':
        if (this._isComplete()) this._checkCompletion(true);
        break;
    }
  }

  _handleBackspace(e, index) {
    this.inputs[index];
    e.preventDefault();

    if (this._values[index]) {
      // Clear current
      this._setInputValue(index, '');
      this._notifyChange();
    } else {
      // Jump to previous and clear it
      const prev = this.rtl.prevIndex(index);
      if (prev !== null) {
        this._setInputValue(prev, '');
        this._focusIndex(prev);
        this._notifyChange();
      }
    }
    this.history.pushIfChanged([...this._values]);
  }

  _handleDelete(e, index) {
    e.preventDefault();
    if (this._values[index]) {
      this._setInputValue(index, '');
      this._notifyChange();
      this.history.pushIfChanged([...this._values]);
    }
  }

  _handleFocus(e, index) {
    const input = this.inputs[index];
    addClasses(input, 'otp-input--focused');
    if (this.options.selectOnFocus) {
      requestAnimationFrame(() => input.select());
    }
    this.emitter.emit('focus', { index, input });
  }

  _handleBlur(e, index) {
    const input = this.inputs[index];
    removeClasses(input, 'otp-input--focused');
    this.emitter.emit('blur', { index, input });
  }

  _handleClick(e, index) {
    // On click, move cursor to end for cleaner UX
    const input = this.inputs[index];
    requestAnimationFrame(() => {
      input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  // ─── Internal Helpers ──────────────────────────────────────────────────────

  _normalize(ch) {
    // Convert native numerals to western before storing
    return this.numbers.toWestern(ch);
  }

  _getDisplayValue(index) {
    const val = this._values[index];
    if (!val) return '';
    return this.options.nativeNumerals ? this.numbers.toLocale(val) : val;
  }

  _setInputValue(index, ch) {
    this._values[index] = ch ? this._normalize(ch) : '';
    const input = this.inputs[index];
    input.value = this._getDisplayValue(index);
    this._updateInputUI(input, index);
  }

  _updateInputUI(input, index) {
    const filled = !!this._values[index];
    if (filled) {
      addClasses(input, 'otp-input--filled');
    } else {
      removeClasses(input, 'otp-input--filled');
    }
  }

  _focusIndex(index) {
    const clamped = Math.max(0, Math.min(index, this.inputs.length - 1));
    this.inputs[clamped]?.focus();
  }

  _isComplete() {
    return this._values.every(v => v !== '');
  }

  _notifyChange() {
    const val = this.getValue();
    this.emitter.emit('change', val);
    this.validation.clearErrors(this.inputs);
  }

  _checkCompletion(force = false) {
    if (!this._isComplete() && !force) return;

    const value = this.getValue();
    if (!this.validation.validateAll(this._values)) {
      const errors = this.validation.markErrors(this.inputs);
      this._animateError();
      this.a11y.announceError(errors.map(e => e.message).join('. '));
      if (this.options.toast?.enabled) {
        const msg = errors[0]?.message || this.options.toast.errorMessage;
        this.toast.error(msg);
      }
      this.emitter.emit('error', errors);
      return;
    }

    if (this.options.biometric?.enabled) {
      this._biometricConfirm(value);
      return;
    }

    this._completeSuccess(value);
  }

  _completeSuccess(value) {
    this._animateSuccess();
    this.a11y.announceCompletion(value);
    if (this.options.toast?.enabled) {
      this.toast.success(this.options.toast.successMessage);
    }
    this.emitter.emit('complete', value);

    if (this.options.autoSubmit) {
      const form = this.container.closest('form');
      if (form) {
        const hidden = form.querySelector('input[name="otp"]') || (() => {
          const h = document.createElement('input');
          h.type = 'hidden'; h.name = 'otp';
          form.appendChild(h); return h;
        })();
        hidden.value = value;
        form.requestSubmit?.() ?? form.submit();
      }
    }
  }

  // ─── Animations ────────────────────────────────────────────────────────────

  _animateError() {
    if (prefersReducedMotion()) return;
    const { animation } = this.options;
    if (!animation?.error) return;

    const targets = animation.error === 'highlight'
      ? this.inputs.filter((_, i) => this._values[i] === '')
      : this.inputs;

    if (animation.error === 'shake' || animation.error === 'both') {
      targets.forEach(inp => {
        inp.classList.remove('otp-anim-shake');
        void inp.offsetWidth; // reflow
        inp.classList.add('otp-anim-shake');
        inp.addEventListener('animationend', () => inp.classList.remove('otp-anim-shake'), { once: true });
      });
    }

    if (animation.error === 'highlight' || animation.error === 'both') {
      targets.forEach(inp => {
        inp.classList.add('otp-anim-highlight');
        inp.addEventListener('animationend', () => inp.classList.remove('otp-anim-highlight'), { once: true });
      });
    }

    this._haptic([100, 50, 100]);
  }

  _animateSuccess() {
    if (prefersReducedMotion()) return;
    if (!this.options.animation?.success) return;
    this.inputs.forEach((inp, i) => {
      setTimeout(() => {
        addClasses(inp, 'otp-input--success', 'otp-anim-pop');
        inp.addEventListener('animationend', () => removeClasses(inp, 'otp-anim-pop'), { once: true });
      }, i * 40);
    });
  }

  // ─── SMS Auto-Read (Web OTP API) ───────────────────────────────────────────

  _initSmsAutoRead() {
    if (!this.options.smsAutoRead || !('OTPCredential' in window)) return;
    const ac = new AbortController();
    this._smsAbortController = ac;
    navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal })
      .then(otp => { if (otp?.code) this.setValue(otp.code); })
      .catch(() => {});
  }

  // ─── Biometric Confirm (WebAuthn) ──────────────────────────────────────────

  async _biometricConfirm(value) {
    if (!window.PublicKeyCredential) {
      this._completeSuccess(value);
      return;
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        this._completeSuccess(value);
        return;
      }

      if (this.options.toast?.enabled) {
        this.toast.info(this.options.biometric.promptText || 'Verify your identity to continue');
      }
      this.emitter.emit('biometric-start');

      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: location.hostname || 'localhost',
          allowCredentials: [],
          userVerification: 'required',
          timeout: 60000,
        },
      });

      if (typeof this.options.biometric.onConfirmed === 'function') this.options.biometric.onConfirmed();
      this.emitter.emit('biometric-confirmed');
      this._completeSuccess(value);
    } catch (err) {
      if (typeof this.options.biometric.onCancelled === 'function') this.options.biometric.onCancelled();
      this.emitter.emit('biometric-cancelled');
      this.setError('Biometric verification was cancelled or failed');
    }
  }

  _triggerError(index) {
    const input = this.inputs[index];
    input.classList.remove('otp-anim-shake');
    void input.offsetWidth;
    input.classList.add('otp-anim-shake');
    input.addEventListener('animationend', () => input.classList.remove('otp-anim-shake'), { once: true });
    this._haptic([50]);
  }

  _haptic(pattern) {
    if (!this.options.haptic || !navigator.vibrate) return;
    navigator.vibrate(pattern || [10]);
  }

  // ─── Undo / Redo ───────────────────────────────────────────────────────────

  _undo() {
    const snapshot = this.history.undo();
    if (!snapshot) return;
    this._applySnapshot(snapshot);
  }

  _redo() {
    const snapshot = this.history.redo();
    if (!snapshot) return;
    this._applySnapshot(snapshot);
  }

  _applySnapshot(snapshot) {
    snapshot.forEach((v, i) => this._setInputValue(i, v));
    this._notifyChange();
    // Focus first empty or last
    const firstEmpty = this._values.findIndex(v => !v);
    this._focusIndex(firstEmpty >= 0 ? firstEmpty : this.inputs.length - 1);
  }

  _selectAll() {
    this.inputs.forEach(inp => inp.select());
  }

  _setExpired(expired) {
    this._expired = expired;
    this.inputs.forEach(inp => { inp.disabled = expired; });
    if (expired) {
      addClasses(this.container, 'otp-root--expired');
    } else {
      removeClasses(this.container, 'otp-root--expired');
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Get current OTP value (always western digits) */
  getValue() {
    return this._values.join('');
  }

  /** Set OTP value programmatically */
  setValue(value) {
    const str = String(value ?? '');
    const chars = str.split('').slice(0, this.options.length);
    chars.forEach((ch, i) => this._setInputValue(i, ch));
    // Clear remaining
    for (let i = chars.length; i < this.inputs.length; i++) this._setInputValue(i, '');
    this.history.push([...this._values]);
    this._notifyChange();
    this._checkCompletion();
  }

  /** Clear all inputs */
  clear() {
    this._values.fill('');
    this.inputs.forEach((inp, i) => {
      inp.value = '';
      this._updateInputUI(inp, i);
    });
    this.validation.clearErrors(this.inputs);
    this.inputs.forEach(inp => removeClasses(inp, 'otp-input--success'));
    this.history.push([...this._values]);
    this._notifyChange();
    if (this.options.autoFocus) this._focusIndex(0);
  }

  /** Focus a specific digit by index */
  focus(index = 0) {
    this._focusIndex(index);
  }

  /** Disable all inputs */
  disable() {
    this.inputs.forEach(inp => { inp.disabled = true; });
    addClasses(this.container, 'otp-root--disabled');
  }

  /** Enable all inputs */
  enable() {
    this.inputs.forEach(inp => { inp.disabled = false; });
    removeClasses(this.container, 'otp-root--disabled');
  }

  /** Trigger error state with optional message */
  setError(message) {
    this._animateError();
    this.inputs.forEach(inp => addClasses(inp, 'otp-input--error'));
    if (message) {
      this.a11y.announceError(message);
      if (this.options.toast?.enabled) this.toast.error(message);
    }
    this.emitter.emit('error', [{ index: -1, message }]);
  }

  /** Switch theme dynamically: 'default'|'underline'|'rounded'|'ghost'|'filled'|'soft'|'neon'|'gradient'|'pill' */
  setTheme(theme) {
    this.options.theme = theme;
    if (theme) this.container.dataset.theme = theme;
    else delete this.container.dataset.theme;
  }

  /** Switch toast theme: 'default'|'glass'|'solid'|'gradient'|'minimal'|'pill' */
  setToastTheme(theme) {
    this.options.toast.theme = theme;
    this.toast.setTheme(theme);
  }

  /** Clear error state */
  clearError() {
    this.validation.clearErrors(this.inputs);
    this.inputs.forEach(inp => removeClasses(inp, 'otp-input--error'));
  }

  /** Reset timer */
  resetTimer(duration) {
    const d = duration ?? this.options.timer?.duration ?? 60;
    this._setExpired(false);
    this.timer.reset(d);
  }

  /** Update direction dynamically */
  setDirection(dir) {
    this.options.direction = dir;
    this.rtl.applyDirection(this.container);
  }

  /** Update locale dynamically */
  setLocale(locale) {
    this.options.locale = locale;
    this.numbers.setLocale(locale);
    // Re-render displayed values
    this.inputs.forEach((inp, i) => {
      inp.lang = locale;
      inp.value = this._getDisplayValue(i);
    });
  }

  /** Subscribe to events */
  on(event, listener) {
    return this.emitter.on(event, listener);
  }

  /** Destroy instance and clean up DOM */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._smsAbortController?.abort();
    this.timer.destroy();
    this.clipboard.destroy();
    this.a11y.destroy();
    this.emitter.removeAllListeners();
    this.container.innerHTML = '';
    removeClasses(this.container, 'otp-root', 'otp-root--disabled', 'otp-root--expired');
    this.inputs = [];
  }
}

// Guard for non-browser environments (SSR, Node, test runners)
const _HTMLElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

/**
 * Web Component: <otp-input />
 *
 * Attributes (all optional):
 *   length, type, secure, auto-focus, auto-submit, direction, locale,
 *   native-numerals, placeholder, haptic, timer-duration, resend-enabled,
 *   resend-cooldown, clipboard-detection
 *
 * Events: otp-change, otp-complete, otp-error, otp-focus, otp-blur, otp-expire, otp-resend
 *
 * @example
 * <otp-input length="6" direction="rtl" locale="ar" native-numerals></otp-input>
 */
class OTPInputElement extends _HTMLElement {
  static get observedAttributes() {
    return [
      'length', 'type', 'secure', 'auto-focus', 'auto-submit',
      'direction', 'locale', 'native-numerals', 'placeholder',
      'haptic', 'timer-duration', 'resend-enabled', 'resend-cooldown',
      'clipboard-detection', 'label', 'theme',
      'toast-enabled', 'toast-theme', 'toast-position',
    ];
  }

  constructor() {
    super();
    this._instance = null;
    this._initialized = false;
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this._init();
    }
  }

  disconnectedCallback() {
    this._instance?.destroy();
    this._instance = null;
    this._initialized = false;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this._initialized || oldVal === newVal) return;
    // Re-initialize on relevant attribute changes
    this._instance?.destroy();
    this._instance = null;
    this._init();
  }

  _init() {
    const bool  = (attr) => this.hasAttribute(attr);
    const num   = (attr, def) => { const v = this.getAttribute(attr); return v !== null ? Number(v) : def; };
    const str   = (attr, def) => this.getAttribute(attr) ?? def;

    const options = {
      length:             num('length', 6),
      type:               str('type', 'numeric'),
      secure:             bool('secure'),
      autoFocus:          bool('auto-focus'),
      autoSubmit:         bool('auto-submit'),
      direction:          str('direction', 'auto'),
      locale:             str('locale', null),
      nativeNumerals:     bool('native-numerals'),
      placeholder:        str('placeholder', '·'),
      haptic:             !bool('no-haptic'),
      clipboardDetection: !bool('no-clipboard'),
      label:              str('label', null),
      theme:              str('theme', 'default'),
      toast: {
        enabled:  bool('toast-enabled'),
        theme:    str('toast-theme', 'default'),
        position: str('toast-position', 'top-right'),
      },
      timer: {
        enabled:  num('timer-duration', 0) > 0,
        duration: num('timer-duration', 60),
        showProgress: bool('timer-progress'),
      },
      resend: {
        enabled:  bool('resend-enabled'),
        cooldown: num('resend-cooldown', 60),
      },
      onChange:   (v)    => this.dispatchEvent(new CustomEvent('otp-change',    { detail: v,       bubbles: true, composed: true })),
      onComplete: (v)    => this.dispatchEvent(new CustomEvent('otp-complete',  { detail: v,       bubbles: true, composed: true })),
      onError:    (errs) => this.dispatchEvent(new CustomEvent('otp-error',     { detail: errs,    bubbles: true, composed: true })),
      onFocus:    (info) => this.dispatchEvent(new CustomEvent('otp-focus',     { detail: info,    bubbles: true, composed: true })),
      onBlur:     (info) => this.dispatchEvent(new CustomEvent('otp-blur',      { detail: info,    bubbles: true, composed: true })),
    };

    this._instance = new OTPInput(this, options);

    this._instance.on('expire', () =>
      this.dispatchEvent(new CustomEvent('otp-expire', { bubbles: true, composed: true }))
    );
    this._instance.on('resend', () =>
      this.dispatchEvent(new CustomEvent('otp-resend', { bubbles: true, composed: true }))
    );
  }

  // ─── Public API (proxy to OTPInput) ────────────────────────────────────────

  getValue()       { return this._instance?.getValue() ?? ''; }
  setValue(v)      { this._instance?.setValue(v); }
  clear()          { this._instance?.clear(); }
  focus(i = 0)     { this._instance?.focus(i); }
  disable()        { this._instance?.disable(); }
  enable()         { this._instance?.enable(); }
  setError(msg)    { this._instance?.setError(msg); }
  clearError()     { this._instance?.clearError(); }
  resetTimer(d)    { this._instance?.resetTimer(d); }
  setDirection(d)  { this._instance?.setDirection(d); }
  setLocale(l)     { this._instance?.setLocale(l); }
}

/** Register the custom element if not already registered */
function registerOTPInputElement(tagName = 'otp-input') {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, OTPInputElement);
  }
}

// Auto-register <otp-input> web component
registerOTPInputElement();

exports.EventEmitter = EventEmitter;
exports.OTPInput = OTPInput;
exports.OTPInputElement = OTPInputElement;
exports.ToastManager = ToastManager;
exports.default = OTPInput;
exports.getDefaultToast = getDefaultToast;
exports.registerOTPInputElement = registerOTPInputElement;
//# sourceMappingURL=otp-input.umd.cjs.map
