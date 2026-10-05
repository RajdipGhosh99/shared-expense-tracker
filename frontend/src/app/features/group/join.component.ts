import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans">
      <div class="max-w-md w-full bg-white p-7 sm:p-9 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        <!-- SKELETON / LOADING VALIDATION -->
        <div *ngIf="validating()" class="py-12 text-center space-y-4">
          <div class="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p class="text-xs font-semibold text-slate-500">Validating invite link...</p>
        </div>

        <!-- INVALID / REVOKED ERROR STATE -->
        <div *ngIf="!validating() && validationError()" class="text-center space-y-5 py-4">
          <div class="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <div class="space-y-1.5">
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Invite Link Unavailable</h2>
            <p class="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {{ validationError() }}
            </p>
          </div>
          <button
            (click)="goToAuth()"
            class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Go to Bhagabhagi Login
          </button>
        </div>

        <!-- VALID INVITE: STEP 1 - WELCOME & SEND OTP -->
        <div *ngIf="!validating() && !validationError() && step() === 'WELCOME'" class="space-y-6">
          <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-xs">
              👋
            </div>
            <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
              Join {{ inviteInfo()?.spaceName }}
            </h2>
            <p class="text-xs text-slate-500">
              You've been invited to join this space. Confirm your display name and request a quick verification code.
            </p>
          </div>

          <div *ngIf="actionError()" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {{ actionError() }}
          </div>

          <form (ngSubmit)="sendOtp()" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700">Your Display Name</label>
              <input
                type="text"
                [(ngModel)]="displayName"
                name="displayName"
                required
                placeholder="e.g. Alex Sharma"
                class="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <div class="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700">
                <span>🔒</span>
                <span>Passwordless Verification</span>
              </div>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                A 6-digit one-time code will be dispatched to the email registered with this invite link.
              </p>
            </div>

            <button
              type="submit"
              [disabled]="loadingAction() || !displayName.trim()"
              class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              {{ loadingAction() ? 'Sending Code...' : 'Send Verification Code to Email' }}
            </button>
          </form>
        </div>

        <!-- VALID INVITE: STEP 2 - ENTER OTP & ENTER SPACE -->
        <div *ngIf="!validating() && !validationError() && step() === 'ENTER_OTP'" class="space-y-6">
          <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-xl shadow-xs">
              ✉️
            </div>
            <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">Check Your Inbox</h2>
            <p class="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              We sent a 6-digit verification code to the email address on file for this invite.
            </p>
          </div>

          <div *ngIf="actionError()" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {{ actionError() }}
          </div>

          <form (ngSubmit)="verifyAndAccept()" class="space-y-4">
            <div class="space-y-1.5 text-center">
              <label class="text-xs font-bold text-slate-700">Enter 6-Digit Code</label>
              <input
                type="text"
                [(ngModel)]="otp"
                name="otp"
                maxlength="6"
                required
                placeholder="000000"
                class="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 font-mono text-center tracking-[0.4em] text-2xl font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              [disabled]="loadingAction() || otp.trim().length !== 6"
              class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              {{ loadingAction() ? 'Verifying & Joining...' : 'Verify & Enter Space' }}
            </button>
          </form>

          <div class="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              (click)="step.set('WELCOME')"
              type="button"
              class="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              ← Edit Name
            </button>

            <button
              (click)="sendOtp()"
              [disabled]="cooldownTimer() > 0 || loadingAction()"
              type="button"
              class="text-indigo-600 hover:text-indigo-800 font-bold disabled:text-slate-400 cursor-pointer"
            >
              {{ cooldownTimer() > 0 ? 'Resend code in ' + cooldownTimer() + 's' : 'Resend Code' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class JoinComponent implements OnInit {
  rawToken = '';
  validating = signal<boolean>(true);
  validationError = signal<string | null>(null);

  inviteInfo = signal<{
    spaceId: string;
    spaceName: string;
    suggestedName?: string;
    currency: string;
  } | null>(null);

  step = signal<'WELCOME' | 'ENTER_OTP'>('WELCOME');
  loadingAction = signal<boolean>(false);
  actionError = signal<string | null>(null);

  displayName = '';
  otp = '';
  cooldownTimer = signal<number>(0);
  private timerInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: ApiService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.rawToken = params['t'] || params['token'] || '';
      if (!this.rawToken) {
        this.validating.set(false);
        this.validationError.set('No invite token was provided in this link. Please request a new invite link from your space admin.');
        return;
      }
      this.validateLink();
    });
  }

  validateLink() {
    this.validating.set(true);
    this.validationError.set(null);

    this.api.validateInvite(this.rawToken).subscribe({
      next: (res) => {
        this.validating.set(false);
        this.inviteInfo.set(res);
        this.displayName = res.suggestedName || '';
      },
      error: (err) => {
        this.validating.set(false);
        this.validationError.set(
          err.error?.error || 'This invite link is invalid, expired, or has been revoked by the space admin.',
        );
      },
    });
  }

  sendOtp() {
    this.loadingAction.set(true);
    this.actionError.set(null);

    this.api.sendInviteOtp(this.rawToken).subscribe({
      next: (res) => {
        this.loadingAction.set(false);
        this.step.set('ENTER_OTP');
        this.startCooldown(res.cooldownSeconds || 60);
      },
      error: (err) => {
        this.loadingAction.set(false);
        this.actionError.set(err.error?.error || 'Failed to send verification code. Please try again.');
      },
    });
  }

  verifyAndAccept() {
    if (this.otp.trim().length !== 6) return;
    this.loadingAction.set(true);
    this.actionError.set(null);

    this.api.acceptInvite({
      token: this.rawToken,
      otp: this.otp.trim(),
      displayName: this.displayName.trim(),
    }).subscribe({
      next: () => {
        this.loadingAction.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loadingAction.set(false);
        this.actionError.set(err.error?.error || 'Failed to verify verification code.');
      },
    });
  }

  private startCooldown(seconds: number) {
    this.cooldownTimer.set(seconds);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const cur = this.cooldownTimer();
      if (cur <= 1) {
        this.cooldownTimer.set(0);
        clearInterval(this.timerInterval);
      } else {
        this.cooldownTimer.set(cur - 1);
      }
    }, 1000);
  }

  goToAuth() {
    this.router.navigate(['/auth']);
  }
}
