/**
 * Vue 3 adapter for otp-input-kit.
 *
 * Usage:
 *   import { OtpInput } from 'otp-input-kit/vue';
 *
 *   <OtpInput
 *     v-model="code"
 *     :length="6"
 *     :on-verify="async (code) => (await api.verify(code)).ok"
 *     @complete="onComplete"
 *     @verified="goHome"
 *     @failed="showError"
 *     ref="otp"
 *   />
 *
 * The component exposes the imperative API via template ref
 * (getValue, setValue, clear, focus, setError, setLoading, setSuccess, …).
 */
import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { OTPInput } from '../core/OTPInput.js';
import '../styles/otp-input.css';

export const OtpInput = defineComponent({
  name: 'OtpInput',
  props: {
    modelValue:         { type: String, default: undefined },
    length:             { type: Number, default: 6 },
    type:               { type: String, default: 'numeric' },
    pattern:            { type: RegExp, default: null },
    secure:             { type: Boolean, default: false },
    autoFocus:          { type: Boolean, default: true },
    autoSubmit:         { type: Boolean, default: false },
    selectOnFocus:      { type: Boolean, default: true },
    direction:          { type: String, default: 'auto' },
    locale:             { type: String, default: null },
    nativeNumerals:     { type: Boolean, default: false },
    placeholder:        { type: String, default: '·' },
    clipboardDetection: { type: Boolean, default: true },
    haptic:             { type: Boolean, default: true },
    smsAutoRead:        { type: Boolean, default: false },
    webOtp:             { type: Boolean, default: false },
    theme:              { type: String, default: 'default' },
    separator:          { type: Object, default: null },
    timer:              { type: Object, default: null },
    resend:             { type: Object, default: null },
    toast:              { type: Object, default: null },
    biometric:          { type: Object, default: null },
    loading:            { type: Object, default: null },
    validate:           { type: Function, default: null },
    onVerify:           { type: Function, default: null },
  },
  emits: [
    'change', 'complete', 'error', 'focus', 'blur',
    'verify-start', 'verified', 'failed', 'expire', 'resend', 'sms-read',
    'update:modelValue',
  ],
  setup(props, { expose, emit }) {
    const el = ref(null);
    let instance = null;

    const build = () => {
      const options = {
        length: props.length,
        type: props.type,
        secure: props.secure,
        autoFocus: props.autoFocus,
        autoSubmit: props.autoSubmit,
        selectOnFocus: props.selectOnFocus,
        direction: props.direction,
        locale: props.locale,
        nativeNumerals: props.nativeNumerals,
        placeholder: props.placeholder,
        clipboardDetection: props.clipboardDetection,
        haptic: props.haptic,
        smsAutoRead: props.smsAutoRead,
        webOtp: props.webOtp,
        theme: props.theme,
        onChange:   (v) => { emit('update:modelValue', v); emit('change', v); },
        onComplete: (v) => emit('complete', v),
        onError:    (e) => emit('error', e),
        onFocus:    (i) => emit('focus', i),
        onBlur:     (i) => emit('blur', i),
        onVerified: (v) => emit('verified', v),
        onFailed:   (m) => emit('failed', m),
      };
      if (props.pattern)   options.pattern   = props.pattern;
      if (props.separator) options.separator = props.separator;
      if (props.timer)     options.timer     = props.timer;
      if (props.resend)    options.resend    = props.resend;
      if (props.toast)     options.toast     = props.toast;
      if (props.biometric) options.biometric = props.biometric;
      if (props.loading)   options.loading   = props.loading;
      if (props.validate)  options.validate  = props.validate;
      if (typeof props.onVerify === 'function') {
        options.onVerify = (v) => props.onVerify(v);
      }

      instance = new OTPInput(el.value, options);
      instance.on('verify-start', (v) => emit('verify-start', v));
      instance.on('expire', () => emit('expire'));
      instance.on('resend', () => emit('resend'));
      instance.on('sms-read', (c) => emit('sms-read', c));
      syncModel();
    };

    // v-model: push external changes into the instance.
    const syncModel = () => {
      if (!instance || props.modelValue == null) return;
      const next = String(props.modelValue);
      if (next !== instance.getValue()) instance.setValue(next);
    };

    onMounted(build);
    onBeforeUnmount(() => { instance?.destroy(); instance = null; });
    watch(() => props.modelValue, syncModel);

    // Rebuild on structural prop changes; live-tune cheaper ones.
    watch(
      () => [
        props.length, props.type, props.secure, props.theme, props.direction,
        props.locale, props.nativeNumerals, props.placeholder, props.separator,
        props.webOtp, props.smsAutoRead,
      ],
      () => { instance?.destroy(); build(); }
    );
    watch(() => props.onVerify, (fn) => {
      if (instance) instance.options.onVerify = typeof fn === 'function' ? (v) => fn(v) : null;
    });

    expose({
      getValue:   () => instance?.getValue() ?? '',
      setValue:   (v) => instance?.setValue(v),
      clear:      () => instance?.clear(),
      focus:      (i) => instance?.focus(i),
      setError:   (m) => instance?.setError(m),
      clearError: () => instance?.clearError(),
      setLoading: (b) => instance?.setLoading(b),
      setSuccess: (m) => instance?.setSuccess(m),
      setTheme:   (t) => instance?.setTheme(t),
      resetTimer: (d) => instance?.resetTimer(d),
      getInstance: () => instance,
    });

    return () => h('div', { ref: el });
  },
});

export default OtpInput;
