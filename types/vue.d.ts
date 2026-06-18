import { DefineComponent } from 'vue';
import { OTPInputOptions } from './index';

/**
 * Vue 3 component wrapping the OTPInput core.
 * Props mirror OTPInputOptions; emits: change, complete, error, focus, blur,
 * verify-start, verified, failed, expire, resend.
 */
export const OtpInput: DefineComponent<Partial<OTPInputOptions>>;

export default OtpInput;
