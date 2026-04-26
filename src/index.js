import './styles/inject.js';
import { OTPInput } from './core/OTPInput.js';
import { OTPInputElement, registerOTPInputElement } from './web-component/OTPInputElement.js';
import { ToastManager, getDefaultToast } from './core/ToastManager.js';
import { EventEmitter } from './utils/events.js';

// Auto-register <otp-input> web component
registerOTPInputElement();

export { OTPInput, OTPInputElement, registerOTPInputElement, ToastManager, getDefaultToast, EventEmitter };
export default OTPInput;
