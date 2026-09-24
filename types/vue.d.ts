import { DefineComponent } from 'vue';
import { OTPInputOptions } from './index';

/**
 * Vue 3 component wrapping the OTPInput core.
 * Props mirror OTPInputOptions plus `modelValue` (v-model); emits: change,
 * update:modelValue, complete, error, focus, blur, verify-start, verified,
 * failed, expire, resend, sms-read.
 */
export const OtpInput: DefineComponent<Partial<OTPInputOptions> & { modelValue?: string }>;

export default OtpInput;
