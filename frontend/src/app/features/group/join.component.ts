import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service.js';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-100 text-slate-900 font-sans">
      <div class="max-w-sm sm:max-w-md w-full bg-white p-6 sm:p-8 rounded-[36px] border border-slate-200/80 shadow-xl space-y-5">
        
        <!-- SKELETON / LOADING VALIDATION -->
        <div *ngIf="validating()" class="py-12 text-center space-y-4">
          <mat-spinner diameter="40" class="mx-auto"></mat-spinner>
          <p class="text-xs font-semibold text-slate-500">Validating invite link...</p>
        </div>

        <!-- INVALID / REVOKED ERROR STATE -->
        <div *ngIf="!validating() && validationError()" class="text-center space-y-4 py-2">
          <div class="size-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto text-2xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div class="space-y-1">
            <h2 class="text-lg font-black text-slate-900 tracking-tight">Invite Link Unavailable</h2>
            <p class="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {{ validationError() }}
            </p>
          </div>
          <button
            mat-flat-button
            (click)="goToAuth()"
            class="!px-5 !py-3 !rounded-2xl !bg-slate-900 hover:!bg-slate-800 !text-white !font-bold !text-xs !shadow-md"
          >
            <i class="fa-solid fa-arrow-right-to-bracket mr-1.5"></i>
            Go to Bhagabhagi Login
          </button>
        </div>

        <!-- VALID INVITE: STEP 1 - WELCOME & SEND OTP -->
        <div *ngIf="!validating() && !validationError() && step() === 'WELCOME'" class="space-y-5">
          <div class="text-center space-y-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              <i class="fa-solid fa-circle-check text-emerald-600"></i> PRE-APPROVED INVITE
            </span>

            <div class="size-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-2xl mx-auto shadow-md">
              <i class="fa-solid fa-building-user text-xl"></i>
            </div>

            <div>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">
                Join {{ inviteInfo()?.spaceName }}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                Confirm your display name to receive your one-time entry code.
              </p>
            </div>
          </div>

          <div *ngIf="actionError()" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation text-rose-500"></i>
            <span>{{ actionError() }}</span>
          </div>

          <form (ngSubmit)="sendOtp()" class="space-y-3.5">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-slate-700 ml-1">Your Display Name</label>
              <input
                type="text"
                [(ngModel)]="displayName"
                name="displayName"
                required
                placeholder="e.g. Alex Sharma"
                class="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-1">
              <div class="flex items-center space-x-1.5 text-[11px] font-bold text-indigo-900">
                <i class="fa-solid fa-shield-halved text-indigo-600"></i>
                <span>Passwordless Verification</span>
              </div>
              <p class="text-[11px] text-indigo-700 leading-relaxed">
                A 6-digit code will be dispatched to the invited email address. Valid for 5 minutes.
              </p>
            </div>

            <button
              mat-flat-button
              type="submit"
              [disabled]="loadingAction() || !displayName.trim()"
              class="!w-full !py-3.5 !rounded-2xl !bg-indigo-600 hover:!bg-indigo-700 !text-white !font-black !text-xs !shadow-md flex items-center justify-center gap-2"
            >
              <i *ngIf="!loadingAction()" class="fa-solid fa-paper-plane mr-1.5"></i>
              <i *ngIf="loadingAction()" class="fa-solid fa-circle-notch fa-spin mr-1.5"></i>
              <span>{{ loadingAction() ? 'Sending Code...' : 'Send Verification Code to Email' }}</span>
            </button>
          </form>
        </div>

        <!-- VALID INVITE: STEP 2 - ENTER OTP & ENTER SPACE -->
        <div *ngIf="!validating() && !validationError() && step() === 'ENTER_OTP'" class="space-y-5">
          <div class="text-center space-y-2">
            <div class="size-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              <i class="fa-solid fa-envelope-open-text text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-black text-slate-900 tracking-tight">Check Your Inbox</h2>
              <p class="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
                We sent a 6-digit verification code to the email address on file. Valid for 5 minutes.
              </p>
            </div>
          </div>

          <div *ngIf="actionError()" class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <i class="fa-solid fa-circle-exclamation text-rose-500"></i>
            <span>{{ actionError() }}</span>
          </div>

          <form (ngSubmit)="verifyAndAccept()" class="space-y-4">
            <div class="space-y-1.5 text-center">
              <label class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Enter 6-Digit Code</label>
              <input
                type="text"
                [(ngModel)]="otp"
                name="otp"
                maxlength="6"
                required
                placeholder="000000"
                class="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-indigo-300 font-mono text-center tracking-[0.5em] text-2xl font-black text-indigo-900 placeholder-slate-300 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              />
            </div>

            <button
              mat-flat-button
              type="submit"
              [disabled]="loadingAction() || otp.trim().length !== 6"
              class="!w-full !py-3.5 !rounded-2xl !bg-emerald-600 hover:!bg-emerald-700 !text-white !font-black !text-xs !shadow-md flex items-center justify-center gap-2"
            >
              <i *ngIf="!loadingAction()" class="fa-solid fa-check mr-1.5"></i>
              <i *ngIf="loadingAction()" class="fa-solid fa-circle-notch fa-spin mr-1.5"></i>
              <span>{{ loadingAction() ? 'Verifying & Joining...' : 'Verify & Enter Space' }}</span>
            </button>
          </form>

          <div class="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              (click)="step.set('WELCOME')"
              type="button"
              class="text-slate-500 hover:text-slate-800 font-bold cursor-pointer flex items-center gap-1"
            >
              <i class="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Edit Name</span>
            </button>

            <button
              (click)="sendOtp()"
              [disabled]="cooldownTimer() > 0 || loadingAction()"
              type="button"
              class="text-indigo-600 hover:text-indigo-800 font-black disabled:text-slate-400 cursor-pointer flex items-center gap-1"
            >
              <i class="fa-solid fa-rotate-right text-[10px]" [class.fa-spin]="loadingAction()"></i>
              <span>{{ cooldownTimer() > 0 ? 'Resend code in ' + cooldownTimer() + 's' : 'Resend Code' }}</span>
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
