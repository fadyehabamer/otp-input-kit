/**
 * Angular adapter for otp-input-kit — a standalone directive.
 *
 * This ships as TypeScript source (Angular projects always compile TS). Add it
 * to any standalone component's `imports`, or declare it in an NgModule.
 *
 * Usage:
 *   import { OtpInputDirective } from 'otp-input-kit/angular';
 *
 *   @Component({
 *     standalone: true,
 *     imports: [OtpInputDirective],
 *     template: `
 *       <div otpInput
 *            [length]="6"
 *            theme="rounded"
 *            [onVerify]="verify"
 *            (complete)="onComplete($event)"
 *            (verified)="goHome()"
 *            (failed)="showError($event)"
 *            #otp="otpInput"></div>
 *     `,
 *   })
 *   export class LoginComponent {
 *     verify = async (code: string) => (await this.api.verify(code)).ok;
 *   }
 *
 * The directive exports itself as `otpInput`, exposing the imperative API
 * (getValue, setValue, clear, focus, setError, setLoading, setSuccess, …).
 *
 * Prefer zero build setup? The `<otp-input>` Web Component works in Angular
 * out of the box — just add `CUSTOM_ELEMENTS_SCHEMA` to your component/module.
 */
import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { OTPInput } from 'otp-input-kit';

@Directive({
  selector: '[otpInput]',
  standalone: true,
  exportAs: 'otpInput',
})
export class OtpInputDirective implements OnInit, OnChanges, OnDestroy {
  @Input() length = 6;
  @Input() type: 'numeric' | 'alpha' | 'alphanumeric' | 'hex' | 'custom' = 'numeric';
  @Input() secure = false;
  @Input() theme = 'default';
  @Input() direction: 'ltr' | 'rtl' | 'auto' = 'auto';
  @Input() locale: string | null = null;
  @Input() nativeNumerals = false;
  @Input() placeholder = '·';
  /** Any extra options merged verbatim (timer, resend, toast, separator, validate, …). */
  @Input() options: Record<string, any> = {};
  /** Async verification — `(value) => boolean | string | object | Promise`. */
  @Input() onVerify?: (value: string) => any;

  @Output() change = new EventEmitter<string>();
  @Output() complete = new EventEmitter<string>();
  @Output() error = new EventEmitter<any>();
  @Output() verified = new EventEmitter<string>();
  @Output() failed = new EventEmitter<string>();
  @Output() expire = new EventEmitter<void>();
  @Output() resend = new EventEmitter<void>();

  private instance: any = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.build();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.instance) return;
    const keys = Object.keys(changes);
    if (keys.length === 1 && keys[0] === 'onVerify') {
      // Live-toggle the verify flow without tearing down the instance.
      this.instance.options.onVerify = this.onVerify ? (v: string) => this.onVerify!(v) : null;
    } else {
      this.rebuild();
    }
  }

  ngOnDestroy(): void {
    this.instance?.destroy();
    this.instance = null;
  }

  private build(): void {
    const opts: Record<string, any> = {
      length: this.length,
      type: this.type,
      secure: this.secure,
      theme: this.theme,
      direction: this.direction,
      locale: this.locale,
      nativeNumerals: this.nativeNumerals,
      placeholder: this.placeholder,
      ...this.options,
      onChange: (v: string) => this.change.emit(v),
      onComplete: (v: string) => this.complete.emit(v),
      onError: (e: any) => this.error.emit(e),
      onVerified: (v: string) => this.verified.emit(v),
      onFailed: (m: string) => this.failed.emit(m),
    };
    if (typeof this.onVerify === 'function') {
      opts['onVerify'] = (v: string) => this.onVerify!(v);
    }

    this.instance = new OTPInput(this.el.nativeElement, opts);
    this.instance.on('expire', () => this.expire.emit());
    this.instance.on('resend', () => this.resend.emit());
  }

  private rebuild(): void {
    this.instance?.destroy();
    this.build();
  }

  // ─── Imperative passthroughs (via template ref: #otp="otpInput") ───────────
  getValue(): string { return this.instance?.getValue() ?? ''; }
  setValue(v: string): void { this.instance?.setValue(v); }
  clear(): void { this.instance?.clear(); }
  focus(i = 0): void { this.instance?.focus(i); }
  setError(m: string): void { this.instance?.setError(m); }
  clearError(): void { this.instance?.clearError(); }
  setLoading(b: boolean): void { this.instance?.setLoading(b); }
  setSuccess(m?: string): void { this.instance?.setSuccess(m); }
  setTheme(t: string): void { this.instance?.setTheme(t); }
  resetTimer(d?: number): void { this.instance?.resetTimer(d); }
  getInstance(): any { return this.instance; }
}
