import {
  Component,
  signal,
  computed,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
import { LoadingService } from '../../core/services/loading.service.js';
import { AddExpenseModalComponent } from '../expenses/add-expense-modal.component.js';
import { BulkExpenseGridComponent } from '../expenses/bulk-expense-grid.component.js';
import {
  Group,
  GroupMember,
  GroupFormControls,
  DEFAULT_GROUP_FORM_CONTROLS,
} from '@shared-expense-tracker/shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AddExpenseModalComponent, BulkExpenseGridComponent],
  template: `
    <!-- Mobile & Desktop Responsive App Container (Standard Mature Theme) -->
    <div
      class="h-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto bg-slate-50 text-slate-900 flex flex-col shadow-xs relative border-x border-slate-200/80 font-sans overflow-hidden"
    >
      <!-- Native Mobile App Header -->
      <header
        class="bg-white/95 backdrop-blur-xl border-b border-slate-200/90 sticky top-0 z-30 px-3 shadow-2xs"
      >
        <div class="relative flex h-11 items-center justify-between gap-2">
          <!-- Space Selector Capsule Pill -->
          <button
            type="button"
            [attr.aria-expanded]="showGroupMenu()"
            aria-haspopup="true"
            (click)="showGroupMenu.set(!showGroupMenu())"
            class="flex items-center gap-2.5 bg-slate-100/90 hover:bg-slate-200/70 active:bg-slate-200 py-1.5 px-3 rounded-2xl transition-all cursor-pointer min-w-0 max-w-[210px] sm:max-w-[260px] border border-slate-200/70 shadow-2xs active:scale-98"
            title="Switch or manage spaces"
          >
            <!-- Space Icon with Admin Crown Indicator -->
            <div
              class="relative size-7 rounded-xl flex items-center justify-center text-xs font-bold shadow-2xs shrink-0"
              [class.bg-gradient-to-tr]="isAdmin()"
              [class.from-indigo-600]="isAdmin()"
              [class.to-violet-600]="isAdmin()"
              [class.text-white]="isAdmin()"
              [class.bg-slate-800]="!isAdmin()"
              [class.text-white]="!isAdmin()"
            >
              🏢
              <span
                *ngIf="isAdmin()"
                class="absolute -top-1.5 -right-1.5 size-3.5 bg-amber-400 text-slate-950 text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs"
                title="Space Admin"
              >
                👑
              </span>
            </div>

            <!-- Space Title & Role Tag -->
            <div class="min-w-0 text-left">
              <div class="flex items-center gap-1">
                <span
                  role="heading"
                  aria-level="1"
                  class="min-w-0 truncate text-xs font-extrabold text-slate-900 tracking-tight"
                >
                  {{ api.activeGroup()?.name || 'My Space' }}
                </span>

                <!-- iOS Native In-Header 8-Spoke Activity Spinner (Concept D) -->
                <span
                  *ngIf="loading.isLoading()"
                  class="inline-flex items-center ml-0.5 text-indigo-600 animate-fade-in"
                  title="Syncing..."
                >
                  <svg class="size-3 animate-ios-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22" opacity="0.25"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" opacity="0.9"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" opacity="0.35"></line>
                    <line x1="2" y1="12" x2="6" y2="12" opacity="0.8"></line>
                    <line x1="18" y1="12" x2="22" y2="12" opacity="0.45"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" opacity="0.7"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" opacity="0.6"></line>
                  </svg>
                </span>

                <svg
                  class="size-3 text-slate-400 shrink-0 transition-transform duration-200"
                  [class.rotate-180]="showGroupMenu()"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m6 9 6 6 6-6" />
                </svg>
              </div>

              <!-- Role Tag / Syncing State -->
              <span
                *ngIf="loading.isLoading()"
                class="text-[9px] font-bold text-indigo-600 block leading-tight animate-pulse"
              >
                Syncing...
              </span>
              <span
                *ngIf="!loading.isLoading() && isAdmin()"
                class="text-[9px] font-black text-amber-600 uppercase tracking-wider block leading-tight"
              >
                Admin
              </span>
              <span
                *ngIf="!loading.isLoading() && !isAdmin()"
                class="text-[9px] font-medium text-slate-500 block leading-tight"
              >
                Member
              </span>
            </div>
          </button>

          <!-- Right Action Capsule -->
          <div class="flex shrink-0 items-center gap-1.5">
            <!-- Admin Quick Invite Button (Opens WhatsApp Invite Generator) -->
            <button
              *ngIf="isAdmin()"
              type="button"
              (click)="openInviteModal()"
              class="size-9 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 active:scale-95 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 shadow-2xs transition-all cursor-pointer"
              title="Generate WhatsApp Invite Link"
              aria-label="Generate WhatsApp Invite Link"
            >
              <span>＋👤</span>
            </button>

            <!-- Regular User: Statements Shortcut -->
            <button
              *ngIf="!isAdmin()"
              type="button"
              (click)="router.navigate(['/statements'])"
              class="size-9 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
              title="Monthly Statements"
              aria-label="Monthly Statements"
            >
              <span>📄</span>
            </button>

            <!-- Tactile Logout Button -->
            <button
              type="button"
              (click)="api.logout(); router.navigate(['/auth'])"
              class="size-9 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 active:scale-95 text-slate-500 flex items-center justify-center transition-all cursor-pointer border border-slate-200/70"
              title="Log out"
              aria-label="Log out"
            >
              <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
            </button>

            <!-- User Avatar Badge with Status Dot -->
            <div class="relative ml-0.5">
              <div
                class="size-9 rounded-2xl flex items-center justify-center text-xs font-black select-none shadow-2xs transition-all"
                [class.ring-2]="isAdmin()"
                [class.ring-amber-400]="isAdmin()"
                [class.bg-slate-900]="isAdmin()"
                [class.text-white]="isAdmin()"
                [class.bg-indigo-600]="!isAdmin()"
                [class.text-white]="!isAdmin()"
                [title]="api.currentUser()?.email || ''"
                aria-hidden="true"
              >
                {{ api.currentUser()?.name?.charAt(0) || 'U' }}
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 size-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
          </div>

          <!-- Space Switcher Dropdown Sheet -->
          <div
            *ngIf="showGroupMenu()"
            class="absolute left-0 top-full z-50 mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div
              class="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100"
            >
              <span>Your Spaces ({{ api.userGroups().length }})</span>
              <button
                (click)="showGroupMenu.set(false)"
                class="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Space list -->
            <div class="max-h-56 overflow-y-auto space-y-1">
              <div
                *ngFor="let ug of api.userGroups()"
                (click)="switchGroup(ug.group)"
                class="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer border"
                [class.bg-indigo-50]="api.activeGroup()?.id === ug.group.id"
                [class.border-indigo-200]="api.activeGroup()?.id === ug.group.id"
                [class.border-transparent]="api.activeGroup()?.id !== ug.group.id"
              >
                <div class="truncate mr-2">
                  <div class="flex items-center space-x-1.5">
                    <span class="text-xs font-bold text-slate-900 truncate">{{
                      ug.group.name
                    }}</span>
                    <span
                      *ngIf="ug.role === 'ADMIN'"
                      class="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold rounded"
                    >
                      👑 Admin
                    </span>
                    <span
                      *ngIf="ug.role !== 'ADMIN'"
                      class="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-medium rounded"
                    >
                      Member
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 font-medium mt-0.5">
                    {{ ug.group.currency || 'INR' }} • {{ ug.status }}
                  </p>
                </div>
                <span
                  *ngIf="api.activeGroup()?.id === ug.group.id"
                  class="text-indigo-600 font-bold text-sm"
                  >✓</span
                >
              </div>
            </div>

            <!-- Quick space actions -->
            <div class="pt-1.5 border-t border-slate-100 space-y-1">
              <button
                (click)="showGroupMenu.set(false); showCreateModal.set(true)"
                class="w-full py-2 px-3 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>＋</span>
                <span>Create New Space</span>
              </button>
              <button
                *ngIf="isAdmin()"
                (click)="showGroupMenu.set(false); openInviteModal()"
                class="w-full py-2 px-3 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>🔗</span>
                <span>Invite Roommate via Link</span>
              </button>
              <button
                *ngIf="isAdmin()"
                (click)="showGroupMenu.set(false); toggleSpaceStatus()"
                class="w-full py-2 px-3 text-left text-xs font-bold rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
                [class.text-amber-700]="(api.activeGroup()?.status || 'ACTIVE') === 'ACTIVE'"
                [class.hover:bg-amber-50]="(api.activeGroup()?.status || 'ACTIVE') === 'ACTIVE'"
                [class.text-emerald-700]="api.activeGroup()?.status === 'INACTIVE'"
                [class.hover:bg-emerald-50]="api.activeGroup()?.status === 'INACTIVE'"
              >
                <span>{{ api.activeGroup()?.status === 'INACTIVE' ? '▶️' : '⏸️' }}</span>
                <span>{{ api.activeGroup()?.status === 'INACTIVE' ? 'Reactivate This Space' : 'Deactivate This Space (Archive)' }}</span>
              </button>
              <button
                *ngIf="isAdmin()"
                (click)="openDeleteSpaceModal()"
                class="w-full py-2 px-3 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>🗑️</span>
                <span>Delete This Space...</span>
              </button>
              <button
                (click)="showGroupMenu.set(false); api.logout(); router.navigate(['/auth'])"
                class="w-full py-2 px-3 text-left text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer border-t border-slate-100 mt-1 pt-2"
              >
                <span>🚪</span>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Integrated Header Laser Shimmer Indicator (Concept D) -->
        <div
          *ngIf="loading.isLoading()"
          class="absolute bottom-0 inset-x-0 h-0.5 bg-indigo-100 overflow-hidden"
        >
          <div class="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-600 to-amber-400 rounded-full animate-shimmer-laser"></div>
        </div>
      </header>

      <!-- Scrollable Body with smooth native scrolling -->
      <main
        #mainContainer
        class="flex-1 p-4 space-y-4 pb-28 overflow-y-auto overscroll-y-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch]"
      >
        <!-- OPTION A: iOS Native Elastic Capsule Pull-To-Refresh -->
        <div
          *ngIf="pullDistance() > 0 || isRefreshing()"
          class="flex items-center justify-center overflow-hidden transition-all duration-75"
          [style.height.px]="isRefreshing() ? 52 : pullDistance()"
        >
          <div
            class="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm transition-transform duration-150"
            [class.scale-105]="pullDistance() >= pullThreshold && !isRefreshing()"
          >
            <!-- 8-Spoke iOS Activity Spinner during refresh -->
            <span
              *ngIf="isRefreshing()"
              class="inline-flex items-center text-indigo-600 animate-fade-in"
            >
              <svg class="size-4 animate-ios-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22" opacity="0.25"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" opacity="0.9"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" opacity="0.35"></line>
                <line x1="2" y1="12" x2="6" y2="12" opacity="0.8"></line>
                <line x1="18" y1="12" x2="22" y2="12" opacity="0.45"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" opacity="0.7"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" opacity="0.6"></line>
              </svg>
            </span>

            <!-- Downward / Flip-Up Arrow Icon when pulling -->
            <span
              *ngIf="!isRefreshing()"
              class="inline-flex items-center text-indigo-600 transition-transform duration-200 ease-out"
              [class.rotate-180]="pullDistance() >= pullThreshold"
            >
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </span>

            <!-- Status text label -->
            <span class="text-[11px] font-bold text-slate-700 tracking-tight">
              {{ isRefreshing() ? 'Syncing...' : (pullDistance() >= pullThreshold ? 'Release to refresh' : 'Pull to refresh') }}
            </span>
          </div>
        </div>

        <!-- ADMIN PENDING APPROVALS ALERT BANNER -->
        <div
          *ngIf="isAdmin() && pendingMembers().length > 0"
          class="bg-amber-50 border border-amber-300 p-4 rounded-2xl shadow-xs space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 text-amber-900">
              <span class="text-base">🔔</span>
              <span class="text-xs font-extrabold uppercase tracking-wide">
                Join Requests ({{ pendingMembers().length }} Pending Approval)
              </span>
            </div>
            <span
              class="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full"
            >
              Admin Action
            </span>
          </div>

          <div class="space-y-2">
            <div
              *ngFor="let pm of pendingMembers()"
              class="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-2xs"
            >
              <div class="truncate mr-2">
                <p class="text-xs font-bold text-slate-900 truncate">{{ pm.name }}</p>
                <p class="text-[11px] text-slate-500 font-mono truncate">{{ pm.userEmail }}</p>
              </div>
              <div class="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  (click)="approve(pm.userEmail)"
                  class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer transition-all"
                >
                  ✓ Approve
                </button>
                <button
                  (click)="reject(pm.userEmail)"
                  class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SPACE INACTIVE / ARCHIVED BANNER -->
        <div
          *ngIf="api.activeGroup()?.status === 'INACTIVE'"
          class="bg-amber-500/15 border-2 border-amber-400 p-4 rounded-2xl shadow-xs space-y-2 text-amber-950"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-xl">⏸️</span>
              <h4 class="text-xs font-black uppercase tracking-wider text-amber-900">
                Space is Currently Inactive (Archived)
              </h4>
            </div>
            <button
              *ngIf="isAdmin()"
              (click)="toggleSpaceStatus()"
              class="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
            >
              ▶ Reactivate
            </button>
          </div>
          <p class="text-xs text-amber-800 leading-relaxed font-medium">
            This space is in read-only mode. Adding new bills and spreadsheet batch imports are temporarily paused. Existing statements, receipts, and balances remain fully accessible.
          </p>
        </div>

        <!-- PENDING MEMBERSHIP WARNING (If logged-in user is pending) -->
        <div
          *ngIf="isCurrentMemberPending()"
          class="bg-amber-500/10 border border-amber-300 p-4 rounded-2xl shadow-xs space-y-1.5 text-amber-950"
        >
          <div class="flex items-center space-x-2">
            <span class="text-base">⏳</span>
            <h4 class="text-xs font-bold uppercase tracking-wider text-amber-900">
              Membership Pending Approval
            </h4>
          </div>
          <p class="text-xs text-amber-800 leading-relaxed">
            You joined <strong>{{ api.activeGroup()?.name }}</strong> via invite code. A group Admin
            must approve your join request before you can log bills or participate in expense
            splits.
          </p>
        </div>

        <!-- Month-End Settlement Banner -->
        <div
          class="bg-amber-50 border border-amber-200/80 text-amber-900 p-3.5 rounded-2xl shadow-xs flex items-center justify-between"
        >
          <div class="space-y-0.5">
            <p
              class="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1.5"
            >
              <svg
                class="w-3.5 h-3.5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Month-End Settlement</span>
            </p>
            <p class="text-xs font-medium text-amber-900">
              Ledger finalized. Settle up or export PDF!
            </p>
          </div>
          <button
            (click)="router.navigate(['/statements'])"
            class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            View ↗
          </button>
        </div>

        <!-- HERO NET STANDING CARD (Standard Clean Executive) -->
        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-500 uppercase tracking-wider font-bold text-[10px]"
              >Your Net Standing</span
            >
            <span
              class="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide border shadow-xs"
              [class.bg-emerald-50]="myNetBalance() >= 0"
              [class.text-emerald-700]="myNetBalance() >= 0"
              [class.border-emerald-200]="myNetBalance() >= 0"
              [class.bg-rose-50]="myNetBalance() < 0"
              [class.text-rose-700]="myNetBalance() < 0"
              [class.border-rose-200]="myNetBalance() < 0"
            >
              {{ myNetBalance() >= 0 ? '🟢 You get back' : '🔴 You owe' }}
            </span>
          </div>

          <div class="flex items-baseline space-x-1.5">
            <span
              class="text-4xl sm:text-5xl font-black tracking-tight"
              [class.text-emerald-600]="myNetBalance() >= 0"
              [class.text-rose-600]="myNetBalance() < 0"
            >
              {{ myNetBalance() >= 0 ? '+' : '-' }}₹{{ absNetBalance() }}
            </span>
          </div>

          <!-- Vacation Mode Toggle Bar -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2 text-slate-700">
              <span class="text-base">🏖️</span>
              <div>
                <div class="flex items-center space-x-1.5">
                  <span class="font-bold text-xs text-slate-800">Vacation Mode</span>
                  <span
                    class="text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors"
                    [class.bg-amber-100]="isAway()"
                    [class.text-amber-800]="isAway()"
                    [class.border]="isAway()"
                    [class.border-amber-300]="isAway()"
                    [class.bg-slate-100]="!isAway()"
                    [class.text-slate-500]="!isAway()"
                  >
                    {{ isAway() ? 'Away (Excluded)' : 'Active' }}
                  </span>
                </div>
                <p class="text-[10px] text-slate-400">
                  {{ isAway() ? 'You are excluded from new shared bills' : 'Split expenses automatically' }}
                </p>
              </div>
            </div>

            <!-- Modern Toggle Switch Button -->
            <button
              type="button"
              role="switch"
              [attr.aria-checked]="isAway()"
              [disabled]="togglingVacation()"
              (click)="toggleVacation()"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50"
              [class.bg-amber-500]="isAway()"
              [class.bg-slate-200]="!isAway()"
              title="Toggle vacation mode"
            >
              <span class="sr-only">Toggle Vacation Mode</span>
              <span
                aria-hidden="true"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px]"
                [class.translate-x-5]="isAway()"
                [class.translate-x-0]="!isAway()"
              >
                <span *ngIf="togglingVacation()" class="animate-spin text-[8px] text-slate-400">⟳</span>
                <span *ngIf="!togglingVacation() && isAway()">🌴</span>
              </span>
            </button>
          </div>
        </div>

        <!-- QUICK ACTIONS BAR (Includes Google Sheet Multiple Entry) -->
        <div class="grid grid-cols-4 gap-2" [class.sm:grid-cols-5]="isAdmin()">
          <!-- Action: Scan Bill -->
          <button
            (click)="router.navigate(['/screenshot-review'])"
            class="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-1.5 shadow-xs active:scale-95 transition-all cursor-pointer group"
          >
            <div
              class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-700">Scan Bill</span>
          </button>

          <!-- Action: Single Add Bill -->
          <button
            (click)="openAddBill()"
            class="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-1.5 shadow-xs active:scale-95 transition-all cursor-pointer group"
          >
            <div
              class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs"
            >
              <span class="text-base font-bold">＋</span>
            </div>
            <span class="text-[10px] font-bold text-slate-700">Add Bill</span>
          </button>

          <!-- Action: Multiple Entry (Spreadsheet Grid Mode) -->
          <button
            (click)="openSheetEntry()"
            class="p-3 bg-emerald-50/80 hover:bg-emerald-100/70 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center space-y-1.5 shadow-xs active:scale-95 transition-all cursor-pointer group"
            title="Add multiple expenses at once in a spreadsheet table"
          >
            <div
              class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-emerald-800">Bulk Entry</span>
          </button>

          <!-- Action: Statements -->
          <button
            (click)="router.navigate(['/statements'])"
            class="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-1.5 shadow-xs active:scale-95 transition-all cursor-pointer group"
          >
            <div
              class="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-700">Reports</span>
          </button>

          <!-- Action: Share WhatsApp (Admin Only) -->
          <button
            *ngIf="isAdmin()"
            (click)="shareInvite()"
            class="hidden sm:flex p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex-col items-center justify-center space-y-1.5 shadow-xs active:scale-95 transition-all cursor-pointer group"
          >
            <div
              class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <span class="text-[10px] font-bold text-slate-700">Invite</span>
          </button>
        </div>

        <!-- REDESIGNED SEGMENTED TAB CONTROLS -->
        <div class="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 text-xs">
          <button
            type="button"
            (click)="activeTab.set('bills')"
            class="flex-1 py-2 rounded-xl font-bold transition-all text-center cursor-pointer"
            [class.bg-white]="activeTab() === 'bills'"
            [class.text-indigo-700]="activeTab() === 'bills'"
            [class.shadow-2xs]="activeTab() === 'bills'"
            [class.text-slate-600]="activeTab() !== 'bills'"
            [class.hover:text-slate-900]="activeTab() !== 'bills'"
          >
            🧾 Bills ({{ api.expenses().length }})
          </button>
          <button
            type="button"
            (click)="activeTab.set('members')"
            class="flex-1 py-2 rounded-xl font-bold transition-all text-center cursor-pointer"
            [class.bg-white]="activeTab() === 'members'"
            [class.text-indigo-700]="activeTab() === 'members'"
            [class.shadow-2xs]="activeTab() === 'members'"
            [class.text-slate-600]="activeTab() !== 'members'"
            [class.hover:text-slate-900]="activeTab() !== 'members'"
          >
            👥 Flatmates ({{ activeMembers().length }})
          </button>
          <button
            *ngIf="isAdmin()"
            type="button"
            (click)="activeTab.set('controls')"
            class="flex-1 py-2 rounded-xl font-bold transition-all text-center cursor-pointer"
            [class.bg-white]="activeTab() === 'controls'"
            [class.text-indigo-700]="activeTab() === 'controls'"
            [class.shadow-2xs]="activeTab() === 'controls'"
            [class.text-slate-600]="activeTab() !== 'controls'"
            [class.hover:text-slate-900]="activeTab() !== 'controls'"
          >
            ⚙️ Form Rules
          </button>
        </div>

        <!-- SUGGESTED SETTLEMENTS (Min-Cash-Flow) (Shown on both Bills and Flatmates tabs when debts exist) -->
        <div
          *ngIf="activeTab() !== 'controls'"
          class="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
        >
          <div class="flex justify-between items-center">
            <h3
              class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span class="text-amber-500">⚡</span>
              <span>Suggested Settlements</span>
            </h3>
            <span
              class="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"
            >
              Min-Cash-Flow
            </span>
          </div>

          <div
            *ngIf="simplifiedDebts().length === 0"
            class="py-6 text-center text-xs text-slate-500 font-medium space-y-1"
          >
            <p class="text-2xl">🎉</p>
            <p>Everyone is settled up! Zero outstanding debts.</p>
          </div>

          <div
            *ngFor="let tx of simplifiedDebts()"
            class="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between transition-all"
          >
            <div class="space-y-0.5">
              <p class="text-xs font-semibold text-slate-700">
                <span class="text-slate-900 font-bold">{{ tx.fromUserEmail.split('@')[0] }}</span>
                <span class="text-slate-400 mx-1">owes</span>
                <span class="text-indigo-600 font-bold">{{
                  tx.receiverName || tx.toUserEmail.split('@')[0]
                }}</span>
              </p>
              <p class="text-lg font-black text-slate-900">₹{{ tx.amountDisplay }}</p>
            </div>

            <!-- Instant UPI Deep Link Button -->
            <div class="flex items-center space-x-2">
              <a
                *ngIf="tx.upiLink"
                [href]="tx.upiLink"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <span>⚡ Pay UPI</span>
              </a>
              <button
                (click)="markSettled(tx)"
                class="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 active:scale-95 transition-all text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Settled
              </button>
            </div>
          </div>
        </div>

        <!-- GROUP MEMBERS & ADMIN MANAGEMENT (Flatmates Tab) -->
        <div
          *ngIf="activeTab() === 'members'"
          class="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
        >
          <div class="flex justify-between items-center">
            <h3
              class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>👥</span>
              <span>Members ({{ activeMembers().length }})</span>
            </h3>
            <div class="flex items-center space-x-2">
              <button
                *ngIf="isAdmin()"
                (click)="openInviteModal()"
                class="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                title="Create personalized invite with move-in date"
              >
                ＋ Invite Roommate
              </button>
              <span
                *ngIf="isAdmin()"
                class="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full"
              >
                Admin
              </span>
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let m of api.members()" class="py-2.5 flex items-center justify-between">
              <div class="flex items-center space-x-2.5 truncate mr-2">
                <div
                  class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0"
                >
                  {{ m.name.charAt(0).toUpperCase() }}
                </div>
                <div class="truncate">
                  <div class="flex flex-wrap items-center gap-1">
                    <p class="text-xs font-bold text-slate-900 truncate">{{ m.name }}</p>
                    <span
                      *ngIf="m.role === 'ADMIN'"
                      class="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold rounded"
                    >
                      Admin
                    </span>
                    <span
                      *ngIf="m.status === 'PENDING'"
                      class="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold rounded"
                    >
                      Pending
                    </span>
                    <span
                      *ngIf="m.status === 'LEFT'"
                      class="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold rounded"
                    >
                      🚪 Vacated {{ m.movedOutAt || '' }}
                    </span>
                    <span
                      *ngIf="m.movedInAt && m.status !== 'LEFT'"
                      class="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-medium rounded"
                    >
                      📅 Since {{ m.movedInAt }}
                    </span>
                    <span
                      *ngIf="m.isAway"
                      class="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-medium rounded"
                    >
                      Away
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 font-mono truncate">{{ m.userEmail }}</p>
                </div>
              </div>

              <!-- Admin controls on members -->
              <div class="flex items-center space-x-1.5 flex-shrink-0">
                <!-- If member is pending and caller is admin -->
                <ng-container *ngIf="isAdmin() && m.status === 'PENDING'">
                  <button
                    (click)="approve(m.userEmail)"
                    class="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-2xs"
                  >
                    ✓ Approve
                  </button>
                  <button
                    (click)="reject(m.userEmail)"
                    class="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg hover:bg-rose-100 cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                </ng-container>

                <!-- If caller is admin: tenancy update, status toggle & promote/demote -->
                <ng-container
                  *ngIf="isAdmin() && m.status !== 'PENDING'"
                >
                  <!-- Member Active / Inactive Toggle -->
                  <button
                    *ngIf="m.userEmail !== api.currentUser()?.email && m.status !== 'LEFT'"
                    (click)="toggleMemberStatus(m)"
                    class="px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors border"
                    [class.bg-emerald-50]="(m.status || 'ACTIVE') === 'ACTIVE'"
                    [class.text-emerald-700]="(m.status || 'ACTIVE') === 'ACTIVE'"
                    [class.border-emerald-200]="(m.status || 'ACTIVE') === 'ACTIVE'"
                    [class.bg-amber-50]="m.status === 'INACTIVE'"
                    [class.text-amber-800]="m.status === 'INACTIVE'"
                    [class.border-amber-200]="m.status === 'INACTIVE'"
                    [title]="m.status === 'INACTIVE' ? 'Activate member' : 'Deactivate member'"
                  >
                    {{ m.status === 'INACTIVE' ? '⏸️ Inactive' : '🟢 Active' }}
                  </button>

                  <button
                    (click)="openTenancyModal(m)"
                    class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    title="Edit move-in or move-out dates"
                  >
                    📅 Tenancy
                  </button>
                  <button
                    *ngIf="m.role === 'MEMBER' && m.userEmail !== api.currentUser()?.email"
                    (click)="setRole(m.userEmail, 'ADMIN')"
                    class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    title="Make this member an Admin"
                  >
                    👑 Make Admin
                  </button>
                  <button
                    *ngIf="m.userEmail !== api.currentUser()?.email"
                    (click)="removeMemberConfirm(m.userEmail, m.name)"
                    class="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    title="Remove member and revoke their access"
                  >
                    ✕ Remove
                  </button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN GROUP EXPENSE ENTRY FORM CONTROLS -->
        <div
          *ngIf="isAdmin() && activeTab() === 'controls'"
          class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
        >
          <!-- Section Header -->
          <div class="px-4.5 pt-4.5 pb-3 border-b border-slate-100">
            <div class="flex justify-between items-center">
              <h3
                class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5"
              >
                <span>⚙️</span>
                <span>Entry Form Controls (Admin)</span>
              </h3>
              <span
                class="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full"
              >
                Group Level
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              Configure how the Add Bill form behaves for all group members. Changes preview in real-time.
            </p>
          </div>

          <!-- Two-pane layout: Controls left, Preview right -->
          <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">

            <!-- LEFT: Controls Table -->
            <div class="p-4.5 space-y-2 text-xs">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Field Settings</p>

              <!-- Subcategory -->
              <div class="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <p class="font-semibold text-slate-800">Subcategory</p>
                  <p class="text-[10px] text-slate-400">Detailed spend (e.g. Groceries, OTT, Metro)</p>
                </div>
                <select
                  [(ngModel)]="formControlsConfig.subCategory"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                >
                  <option value="editable">Editable (Optional)</option>
                  <option value="mandatory">Mandatory</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <!-- Split Method -->
              <div class="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <p class="font-semibold text-slate-800">Split Method</p>
                  <p class="text-[10px] text-slate-400">Lock to equal or allow custom splits</p>
                </div>
                <select
                  [(ngModel)]="formControlsConfig.splitType"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                >
                  <option value="editable">Editable (Any Split)</option>
                  <option value="view_only">View Only (Lock Equal)</option>
                  <option value="hidden">Hidden (Always Equal)</option>
                </select>
              </div>

              <!-- Notes -->
              <div class="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <p class="font-semibold text-slate-800">Notes / Memo</p>
                  <p class="text-[10px] text-slate-400">Context or item description</p>
                </div>
                <select
                  [(ngModel)]="formControlsConfig.notes"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                >
                  <option value="editable">Editable (Optional)</option>
                  <option value="mandatory">Mandatory</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <!-- Date -->
              <div class="flex items-center justify-between py-2">
                <div>
                  <p class="font-semibold text-slate-800">Date</p>
                  <p class="text-[10px] text-slate-400">Expense date picker</p>
                </div>
                <select
                  [(ngModel)]="formControlsConfig.date"
                  class="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                >
                  <option value="mandatory">Mandatory</option>
                  <option value="editable">Editable (Optional)</option>
                  <option value="view_only">View Only (Today)</option>
                </select>
              </div>
            </div>

            <!-- RIGHT: Live Form Preview -->
            <div class="p-4.5 bg-slate-50/60">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-1">
                <span>👁</span>
                <span>Live Preview — Add Bill Form</span>
              </p>

              <!-- Mock form preview -->
              <div class="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-xs text-xs pointer-events-none select-none">

                <!-- Amount — always mandatory -->
                <div class="bg-slate-50 rounded-xl border border-slate-200 py-2 px-3 text-center">
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Amount <span class="text-rose-500">*</span></p>
                  <p class="text-slate-300 font-black text-2xl">₹ 0.00</p>
                </div>

                <!-- Title — always mandatory -->
                <div>
                  <div class="flex justify-between mb-0.5">
                    <span class="font-semibold text-slate-600 text-[10px]">What is this for?</span>
                    <span class="text-[9px] text-rose-500 font-bold">* Mandatory</span>
                  </div>
                  <div class="w-full h-7 rounded-lg border border-slate-200 bg-slate-50"></div>
                </div>

                <!-- Date field preview -->
                <div>
                  <div class="flex justify-between mb-0.5">
                    <span class="font-semibold text-slate-600 text-[10px]">Date</span>
                    <span
                      *ngIf="formControlsConfig.date === 'mandatory'"
                      class="text-[9px] text-rose-500 font-bold"
                    >* Mandatory</span>
                    <span
                      *ngIf="formControlsConfig.date === 'view_only'"
                      class="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 rounded border border-indigo-200 font-bold"
                    >🔒 Today</span>
                    <span
                      *ngIf="formControlsConfig.date === 'editable'"
                      class="text-[9px] text-slate-400"
                    >Optional</span>
                  </div>
                  <div
                    class="w-full h-7 rounded-lg border border-slate-200"
                    [class.bg-slate-100]="formControlsConfig.date === 'view_only'"
                    [class.bg-slate-50]="formControlsConfig.date !== 'view_only'"
                  ></div>
                </div>

                <!-- Category — always shown, mandatory -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <div class="flex justify-between mb-0.5">
                      <span class="font-semibold text-slate-600 text-[10px]">Category</span>
                      <span class="text-[9px] text-rose-500 font-bold">* Mandatory</span>
                    </div>
                    <div class="w-full h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center px-2">
                      <span class="text-slate-400 text-[10px]">🍔 Food &amp; Dining</span>
                    </div>
                  </div>

                  <!-- Subcategory preview -->
                  <div *ngIf="formControlsConfig.subCategory !== 'hidden'">
                    <div class="flex justify-between mb-0.5">
                      <span class="font-semibold text-slate-600 text-[10px]">Subcategory</span>
                      <span
                        *ngIf="formControlsConfig.subCategory === 'mandatory'"
                        class="text-[9px] text-rose-500 font-bold"
                      >* Mandatory</span>
                      <span
                        *ngIf="formControlsConfig.subCategory === 'editable'"
                        class="text-[9px] text-slate-400"
                      >Optional</span>
                    </div>
                    <div class="w-full h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center px-2">
                      <span class="text-slate-400 text-[10px]">• Groceries &amp; Dark Stores</span>
                    </div>
                  </div>
                  <div *ngIf="formControlsConfig.subCategory === 'hidden'">
                    <div class="w-full h-7 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                      <span class="text-[9px] text-slate-300 italic">Subcategory hidden</span>
                    </div>
                  </div>
                </div>

                <!-- Split Method preview -->
                <div *ngIf="formControlsConfig.splitType !== 'hidden'">
                  <div class="flex justify-between mb-0.5">
                    <span class="font-semibold text-slate-600 text-[10px]">Split Method</span>
                    <span
                      *ngIf="formControlsConfig.splitType === 'view_only'"
                      class="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 rounded border border-indigo-200 font-bold"
                    >🔒 Locked: Equal</span>
                  </div>
                  <div
                    *ngIf="formControlsConfig.splitType === 'view_only'"
                    class="w-full h-7 rounded-lg border border-slate-200 bg-slate-100 flex items-center px-2"
                  >
                    <span class="text-slate-500 text-[10px]">🔒 Equal Split (Set by Group Admin)</span>
                  </div>
                  <div
                    *ngIf="formControlsConfig.splitType === 'editable'"
                    class="w-full h-7 rounded-lg border border-slate-200 bg-slate-50 flex items-center px-2"
                  >
                    <span class="text-slate-400 text-[10px]">Equal Split ▾</span>
                  </div>
                </div>
                <div *ngIf="formControlsConfig.splitType === 'hidden'">
                  <div class="w-full h-7 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                    <span class="text-[9px] text-slate-300 italic">Split method hidden (always equal)</span>
                  </div>
                </div>

                <!-- Notes preview -->
                <div *ngIf="formControlsConfig.notes !== 'hidden'">
                  <div class="flex justify-between mb-0.5">
                    <span class="font-semibold text-slate-600 text-[10px]">Notes / Memo</span>
                    <span
                      *ngIf="formControlsConfig.notes === 'mandatory'"
                      class="text-[9px] text-rose-500 font-bold"
                    >* Mandatory</span>
                    <span
                      *ngIf="formControlsConfig.notes === 'editable'"
                      class="text-[9px] text-slate-400"
                    >Optional</span>
                  </div>
                  <div class="w-full h-7 rounded-lg border border-slate-200 bg-slate-50"></div>
                </div>
                <div *ngIf="formControlsConfig.notes === 'hidden'">
                  <div class="w-full h-7 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center">
                    <span class="text-[9px] text-slate-300 italic">Notes field hidden</span>
                  </div>
                </div>

                <!-- Submit button mock -->
                <div class="w-full py-2.5 bg-indigo-600/80 rounded-xl text-center text-white text-[10px] font-bold mt-1">
                  Save &amp; Split Bill
                </div>
              </div>

              <!-- Legend -->
              <div class="flex flex-wrap gap-2 mt-2.5 text-[9px] text-slate-500">
                <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded bg-rose-100 border border-rose-300 inline-block"></span><span>Mandatory</span></span>
                <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded bg-slate-100 border border-slate-300 inline-block"></span><span>Editable / Optional</span></span>
                <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded border border-dashed border-slate-300 inline-block"></span><span>Hidden</span></span>
                <span class="flex items-center space-x-1"><span class="w-2 h-2 rounded bg-indigo-100 border border-indigo-300 inline-block"></span><span>Locked</span></span>
              </div>
            </div>
          </div>

          <!-- Footer: Save button -->
          <div class="px-4.5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span
              *ngIf="controlsSavedMsg()"
              class="text-[11px] font-bold text-emerald-600 flex items-center space-x-1"
            >
              <span>✓</span><span>{{ controlsSavedMsg() }}</span>
            </span>
            <span *ngIf="!controlsSavedMsg()"></span>
            <button
              (click)="saveFormControls()"
              [disabled]="savingControls()"
              class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
            >
              {{ savingControls() ? 'Saving...' : 'Save Form Controls' }}
            </button>
          </div>
        </div>

        <!-- RECENT GROUP EXPENSES FEED (Bills Tab) -->
        <div
          *ngIf="activeTab() === 'bills'"
          class="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
        >
          <div class="flex justify-between items-center">
            <h3
              class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>🧾</span>
              <span>Recent Bills</span>
            </h3>
            <span
              class="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full"
            >
              {{ api.expenses().length }} entries
            </span>
          </div>

          <div
            *ngIf="api.expenses().length === 0"
            class="py-8 text-center text-xs text-slate-400 space-y-1"
          >
            <p class="text-2xl">📋</p>
            <p>No bills logged yet. Tap ＋ Add Bill or Bulk Entry above!</p>
          </div>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let exp of api.expenses()" class="py-3 flex items-center justify-between">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="text-sm">{{ getCategoryIcon(exp.category) }}</span>
                  <p class="font-bold text-slate-900 text-xs">{{ exp.title }}</p>
                  <!-- Overwritten Flag Badge -->
                  <span
                    *ngIf="exp.overwrittenFlag === 'YES'"
                    class="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[9px] font-bold rounded"
                  >
                    🔄 Overwritten
                  </span>
                </div>
                <p class="text-[11px] text-slate-500">
                  Paid by
                  <span class="font-semibold text-slate-700">{{
                    exp.payerEmail.split('@')[0]
                  }}</span>
                  • {{ exp.category }}
                  <span *ngIf="exp.subCategory" class="text-indigo-600 font-medium"
                    >› {{ exp.subCategory }}</span
                  >
                  <span *ngIf="exp.notes" class="text-slate-400 italic">({{ exp.notes }})</span>
                  •
                  <span class="text-slate-500">{{ exp.date || exp.createdAt.slice(0, 10) }}</span>
                </p>
              </div>

              <div class="text-right space-y-0.5">
                <p class="font-bold text-slate-900 text-sm">₹{{ exp.totalAmountDisplay }}</p>
                <button
                  (click)="deleteExpense(exp.id)"
                  class="text-slate-400 hover:text-rose-600 text-[10px] font-semibold active:scale-90 cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Fixed Mobile Bottom Navigation Bar -->
      <nav
        class="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-lg md:max-w-2xl mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-40 shadow-sm"
      >
        <!-- Home Tab -->
        <button
          (click)="router.navigate(['/dashboard'])"
          class="flex flex-col items-center justify-center text-indigo-600 active:scale-90 transition-transform cursor-pointer"
        >
          <span class="text-lg">🏠</span>
          <span class="text-[10px] font-bold text-indigo-600">Home</span>
        </button>

        <!-- Scan Receipt Tab -->
        <button
          (click)="router.navigate(['/screenshot-review'])"
          class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-transform cursor-pointer"
        >
          <span class="text-lg">📷</span>
          <span class="text-[10px] font-medium">Scan Bill</span>
        </button>

        <!-- Center Prominent ADD EXPENSE Floating Button -->
        <button
          (click)="openAddBill()"
          class="-mt-5 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center text-2xl font-bold shadow-md active:scale-95 transition-transform cursor-pointer"
        >
          ＋
        </button>

        <!-- Multiple Entry (Bulk View) Tab -->
        <button
          (click)="openSheetEntry()"
          class="flex flex-col items-center justify-center text-emerald-700 hover:text-emerald-800 active:scale-90 transition-transform cursor-pointer"
        >
          <span class="text-lg">📊</span>
          <span class="text-[10px] font-bold">Bulk</span>
        </button>

        <!-- Statements Tab -->
        <button
          (click)="router.navigate(['/statements'])"
          class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-transform cursor-pointer"
        >
          <span class="text-lg">📈</span>
          <span class="text-[10px] font-medium">Reports</span>
        </button>
      </nav>

      <!-- Single Add Expense Mobile Bottom Sheet -->
      <app-add-expense-modal
        *ngIf="showAddModal()"
        (close)="showAddModal.set(false)"
        (openBulk)="showAddModal.set(false); showBulkModal.set(true)"
      ></app-add-expense-modal>

      <!-- Google Sheet Multiple Entry Spreadsheet Grid Modal -->
      <app-bulk-expense-grid
        *ngIf="showBulkModal()"
        (close)="showBulkModal.set(false)"
        (openSingle)="showBulkModal.set(false); showAddModal.set(true)"
      ></app-bulk-expense-grid>

      <!-- Create Group Modal -->
      <div
        *ngIf="showCreateModal()"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-sm text-slate-900">Create New Group</h3>
            <button
              (click)="showCreateModal.set(false)"
              class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div
            *ngIf="modalError()"
            class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl"
          >
            {{ modalError() }}
          </div>

          <form (ngSubmit)="createGroupSubmit()" class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Group Name</label>
              <input
                type="text"
                [(ngModel)]="newGroupName"
                name="newGroupName"
                required
                placeholder="e.g. Palm Springs 402"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Currency</label>
              <select
                [(ngModel)]="newGroupCurrency"
                name="newGroupCurrency"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>

            <button
              type="submit"
              [disabled]="modalLoading() || !newGroupName.trim()"
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              {{ modalLoading() ? 'Creating...' : 'Create Group (You will be Admin)' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Join Group Modal -->
      <div
        *ngIf="showJoinModal()"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="font-bold text-sm text-slate-900">Join Another Group</h3>
            <button
              (click)="showJoinModal.set(false)"
              class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div
            *ngIf="modalError()"
            class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl"
          >
            {{ modalError() }}
          </div>

          <div
            *ngIf="modalSuccess()"
            class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl"
          >
            {{ modalSuccess() }}
          </div>

          <form (ngSubmit)="joinGroupSubmit()" class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">6-Character Invite Code</label>
              <input
                type="text"
                [(ngModel)]="joinInviteCode"
                name="joinInviteCode"
                required
                placeholder="e.g. PAL4X9"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-center tracking-widest uppercase text-base text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <p class="text-[10px] text-slate-500">
                Note: Group Admin must approve your join request before you can split bills.
              </p>
            </div>

            <button
              type="submit"
              [disabled]="modalLoading() || !joinInviteCode.trim()"
              class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              {{ modalLoading() ? 'Joining...' : 'Send Join Request' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Invite Roommate with Secure Link Modal -->
      <div
        *ngIf="showInviteModal()"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg">💌</span>
              <h3 class="font-bold text-sm text-slate-900">Invite Roommate</h3>
            </div>
            <button
              (click)="showInviteModal.set(false)"
              class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div
            *ngIf="inviteError()"
            class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl"
          >
            {{ inviteError() }}
          </div>

          <!-- SUCCESS STATE WITH WHATSAPP SHARE & COPY -->
          <div
            *ngIf="inviteSuccessUrl()"
            class="p-4 bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs rounded-2xl space-y-3"
          >
            <div class="flex items-center space-x-2">
              <span class="text-lg">🎉</span>
              <p class="font-bold text-emerald-900">Invite Link Ready!</p>
            </div>
            <p class="text-[11px] text-emerald-800 leading-relaxed">
              This link is permanently valid until you remove this roommate. When they open it, their email stays private and they verify with a 6-digit OTP code.
            </p>

            <div class="space-y-2 pt-1">
              <button
                type="button"
                (click)="shareInviteOnWhatsApp()"
                class="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] active:scale-98 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <span>💬</span>
                <span>Share via WhatsApp</span>
              </button>

              <button
                type="button"
                (click)="copyGeneratedInviteLink()"
                class="w-full py-2.5 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>📋</span>
                <span>{{ copiedInvite() ? 'Copied to Clipboard!' : 'Copy Invite Link' }}</span>
              </button>
            </div>

            <button
              type="button"
              (click)="inviteSuccessUrl.set(null)"
              class="w-full pt-1 text-[11px] text-slate-500 hover:text-slate-800 text-center font-semibold cursor-pointer block"
            >
              + Create Another Invite
            </button>
          </div>

          <form *ngIf="!inviteSuccessUrl()" (ngSubmit)="sendInviteSubmit()" class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Email Address (Required)</label>
              <input
                type="email"
                [(ngModel)]="inviteEmail"
                name="inviteEmail"
                required
                placeholder="e.g. roommate@gmail.com"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <p class="text-[10px] text-slate-400">The OTP will be dispatched to this email upon opening the link.</p>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Display Name (Optional)</label>
              <input
                type="text"
                [(ngModel)]="inviteName"
                name="inviteName"
                placeholder="e.g. Priya Sharma"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              [disabled]="inviteLoading() || !inviteEmail.trim()"
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              {{ inviteLoading() ? 'Generating Link...' : 'Generate WhatsApp Invite Link' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Member Tenancy Modal -->
      <div
        *ngIf="showTenancyModal()"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <span class="text-lg">📅</span>
              <h3 class="font-bold text-sm text-slate-900">Manage Member Tenancy</h3>
            </div>
            <button
              (click)="showTenancyModal.set(false)"
              class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div
            *ngIf="tenancyError()"
            class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl"
          >
            {{ tenancyError() }}
          </div>

          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <p class="font-bold text-xs text-slate-900">{{ tenancyTargetMember?.name }}</p>
            <p class="text-[10px] text-slate-500 font-mono">{{ tenancyTargetMember?.userEmail }}</p>
          </div>

          <form (ngSubmit)="saveTenancySubmit()" class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Physical Move-In Date</label>
              <input
                type="date"
                [(ngModel)]="tenancyMoveInDate"
                name="tenancyMoveInDate"
                required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-700">Move-Out Date (Vacated)</label>
                <button
                  type="button"
                  (click)="clearMoveOutDate()"
                  class="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  title="Remove move-out date and keep roommate active"
                >
                  ✕ Clear Date (Residing)
                </button>
              </div>
              <input
                type="date"
                [(ngModel)]="tenancyMoveOutDate"
                name="tenancyMoveOutDate"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <p class="text-[10px] text-slate-500">
                {{ tenancyMoveOutDate ? 'Setting a move-out date marks this flatmate as left after that date.' : 'No move-out date set: this flatmate is actively residing.' }}
              </p>
            </div>

            <button
              type="submit"
              [disabled]="tenancyLoading() || !tenancyMoveInDate"
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              {{ tenancyLoading() ? 'Saving...' : 'Update Tenancy Dates' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Delete Space Permanently Modal (Requires Typing Space Name) -->
      <div
        *ngIf="showDeleteSpaceModal()"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-rose-200"
        >
          <div class="flex items-center justify-between border-b border-rose-100 pb-3">
            <div class="flex items-center space-x-2 text-rose-600">
              <span class="text-lg">⚠️</span>
              <h3 class="font-extrabold text-sm text-slate-900">Delete Space Permanently</h3>
            </div>
            <button
              (click)="showDeleteSpaceModal.set(false)"
              class="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p class="text-xs text-slate-600 leading-relaxed">
            This action <strong>CANNOT</strong> be undone. All expenses, settlements, statements, and active invites for
            <strong class="text-slate-900">{{ api.activeGroup()?.name }}</strong> will be permanently deleted.
          </p>

          <div
            *ngIf="deleteSpaceError()"
            class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl"
          >
            {{ deleteSpaceError() }}
          </div>

          <div class="space-y-1.5 bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200">
            <label class="text-[11px] font-bold text-rose-900 block">
              Type <span class="select-all font-mono font-black text-rose-950 underline">{{ api.activeGroup()?.name }}</span> to confirm:
            </label>
            <input
              type="text"
              [(ngModel)]="deleteConfirmInput"
              placeholder="Type exact space name"
              class="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500 bg-white"
            />
          </div>

          <div class="flex gap-2 pt-1">
            <button
              type="button"
              (click)="showDeleteSpaceModal.set(false)"
              class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              [disabled]="deleteSpaceLoading() || deleteConfirmInput.trim().toLowerCase() !== (api.activeGroup()?.name || '').trim().toLowerCase()"
              (click)="confirmDeleteSpaceSubmit()"
              class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {{ deleteSpaceLoading() ? 'Deleting...' : 'Delete Space' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mainContainer') mainContainerRef?: ElementRef<HTMLElement>;

  readonly pullThreshold = 68;
  pullDistance = signal(0);
  isRefreshing = signal(false);
  private unbindTouchListeners?: () => void;

  showAddModal = signal<boolean>(false);
  showBulkModal = signal<boolean>(false);
  copiedCode = signal<boolean>(false);

  showGroupMenu = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);
  showJoinModal = signal<boolean>(false);
  showDeleteSpaceModal = signal<boolean>(false);
  deleteConfirmInput = '';
  deleteSpaceLoading = signal<boolean>(false);
  deleteSpaceError = signal<string | null>(null);

  // Redesigned Dashboard Segmented Tab ('bills' | 'members' | 'controls')
  activeTab = signal<'bills' | 'members' | 'controls'>('bills');

  newGroupName = '';
  newGroupCurrency = 'INR';
  joinInviteCode = '';
  modalLoading = signal<boolean>(false);
  modalError = signal<string | null>(null);
  modalSuccess = signal<string | null>(null);

  // Tenancy & Personalized Invites
  showInviteModal = signal<boolean>(false);
  inviteName = '';
  inviteEmail = '';
  inviteMoveInDate = new Date().toISOString().slice(0, 10);
  inviteLoading = signal<boolean>(false);
  inviteError = signal<string | null>(null);
  inviteSuccessCode = signal<string | null>(null);
  inviteSuccessUrl = signal<string | null>(null);
  copiedInvite = signal<boolean>(false);

  showTenancyModal = signal<boolean>(false);
  tenancyTargetMember: GroupMember | null = null;
  tenancyMoveInDate = '';
  tenancyMoveOutDate = '';
  tenancyLoading = signal<boolean>(false);
  tenancyError = signal<string | null>(null);

  isAdmin = computed(() => {
    const user = this.api.currentUser();
    const mem = this.api
      .members()
      .find((m) => m.userEmail.toLowerCase() === user?.email.toLowerCase());
    return mem?.role === 'ADMIN';
  });

  isCurrentMemberPending = computed(() => {
    const user = this.api.currentUser();
    const mem = this.api
      .members()
      .find((m) => m.userEmail.toLowerCase() === user?.email.toLowerCase());
    return mem?.status === 'PENDING';
  });

  pendingMembers = computed(() => {
    return this.api.members().filter((m) => m.status === 'PENDING');
  });

  activeMembers = computed(() => {
    return this.api.members().filter((m) => m.status !== 'PENDING');
  });

  myNetBalance = computed(() => {
    const user = this.api.currentUser();
    const sheet = this.api.balanceSheet();
    if (!user || !sheet || !sheet.netBalances) return 0;
    const minor = sheet.netBalances[user.email] || 0;
    return Math.round((minor / 100) * 100) / 100;
  });

  absNetBalance = computed(() => {
    return Math.abs(this.myNetBalance()).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  });

  simplifiedDebts = computed(() => {
    return this.api.balanceSheet()?.simplifiedDebts || [];
  });

  isAway = computed(() => {
    const user = this.api.currentUser();
    const member = this.api
      .members()
      .find((m) => m.userEmail.toLowerCase() === user?.email.toLowerCase());
    return member?.isAway || false;
  });

  formControlsConfig: GroupFormControls = { ...DEFAULT_GROUP_FORM_CONTROLS };
  savingControls = signal<boolean>(false);
  controlsSavedMsg = signal<string | null>(null);
  togglingVacation = signal<boolean>(false);

  constructor(
    public api: ApiService,
    public router: Router,
    public loading: LoadingService,
    private ngZone: NgZone,
  ) { }

  ngOnInit() {
    this.api.fetchUserGroups().subscribe({
      next: (res) => {
        if (!res.memberships || res.memberships.length === 0) {
          this.router.navigate(['/onboarding']);
          return;
        }
        const active = this.api.activeGroup();
        if (active) {
          if (active.formControls) {
            this.formControlsConfig = { ...active.formControls };
          }
          // If members haven't loaded yet, guarantee group data refresh
          if (this.api.members().length === 0) {
            this.api.refreshGroupData(active.id);
          }
        }
      },
    });
  }

  ngAfterViewInit() {
    this.setupSmoothPullGesture();
  }

  ngOnDestroy() {
    if (this.unbindTouchListeners) {
      this.unbindTouchListeners();
      this.unbindTouchListeners = undefined;
    }
  }

  private setupSmoothPullGesture() {
    const el = this.mainContainerRef?.nativeElement;
    if (!el) return;

    this.ngZone.runOutsideAngular(() => {
      // Gesture state
      let startY = 0;
      let startX = 0;
      let intentDecided = false;   // has direction been decided yet?
      let isPullDown = false;       // is this gesture a pull-down (vs scroll)?

      const handleTouchStart = (e: TouchEvent) => {
        // Only arm if we're at the very top and not already refreshing
        if (el.scrollTop <= 0 && !this.isRefreshing()) {
          startY = e.touches[0].clientY;
          startX = e.touches[0].clientX;
          intentDecided = false;
          isPullDown = false;
        } else {
          startY = -1; // sentinel: not arming
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (startY < 0 || this.isRefreshing()) return;

        const touch = e.touches[0];
        const dy = touch.clientY - startY;
        const dx = Math.abs(touch.clientX - startX);

        // First meaningful movement: decide if pull-down or scroll
        if (!intentDecided && (Math.abs(dy) > 6 || dx > 6)) {
          intentDecided = true;
          // Only treat as pull-down if clearly moving down, not sideways, and still at top
          isPullDown = dy > 0 && dx < dy * 0.6 && el.scrollTop <= 0;
          if (!isPullDown) {
            startY = -1; // abort pull tracking, let browser scroll freely
            if (this.pullDistance() !== 0) {
              this.ngZone.run(() => this.pullDistance.set(0));
            }
            return;
          }
        }

        if (!intentDecided || !isPullDown) return;

        // Cancel if user scrolled into content
        if (el.scrollTop > 0) {
          startY = -1;
          isPullDown = false;
          if (this.pullDistance() !== 0) {
            this.ngZone.run(() => this.pullDistance.set(0));
          }
          return;
        }

        // Compute elastic distance — fully passive, no preventDefault
        if (dy > 0) {
          const dist = Math.min(dy * 0.4, this.pullThreshold + 20);
          this.ngZone.run(() => this.pullDistance.set(dist));
        }
      };

      const handleTouchEnd = () => {
        if (startY < 0 || !isPullDown) {
          startY = -1;
          isPullDown = false;
          intentDecided = false;
          return;
        }

        const currentDist = this.pullDistance();
        startY = -1;
        isPullDown = false;
        intentDecided = false;

        this.ngZone.run(() => {
          if (currentDist < this.pullThreshold || this.isRefreshing()) {
            this.pullDistance.set(0);
            return;
          }

          this.isRefreshing.set(true);
          this.pullDistance.set(0);
          const finishRefresh = () => this.isRefreshing.set(false);

          this.api.fetchUserGroups().subscribe({
            next: () => {
              const groupId = this.api.activeGroup()?.id;
              if (groupId) {
                this.api.refreshGroupData(groupId, finishRefresh);
              } else {
                finishRefresh();
              }
            },
            error: finishRefresh,
          });
        });
      };

      // ALL listeners are passive — browser scroll is NEVER blocked
      const opts = { passive: true };
      el.addEventListener('touchstart', handleTouchStart, opts);
      el.addEventListener('touchmove', handleTouchMove, opts);
      el.addEventListener('touchend', handleTouchEnd, opts);
      el.addEventListener('touchcancel', handleTouchEnd, opts);

      this.unbindTouchListeners = () => {
        el.removeEventListener('touchstart', handleTouchStart);
        el.removeEventListener('touchmove', handleTouchMove);
        el.removeEventListener('touchend', handleTouchEnd);
        el.removeEventListener('touchcancel', handleTouchEnd);
      };
    });
  }

  saveFormControls() {
    const group = this.api.activeGroup();
    if (!group) return;

    this.savingControls.set(true);
    this.controlsSavedMsg.set(null);

    this.api.updateGroupFormControls(group.id, this.formControlsConfig).subscribe({
      next: () => {
        this.savingControls.set(false);
        this.controlsSavedMsg.set('Controls saved!');
        setTimeout(() => this.controlsSavedMsg.set(null), 2500);
      },
      error: () => {
        this.savingControls.set(false);
      },
    });
  }

  switchGroup(group: Group) {
    this.api.setActiveGroup(group);
    this.showGroupMenu.set(false);
    if (group.formControls) {
      this.formControlsConfig = { ...group.formControls };
    } else {
      this.formControlsConfig = { ...DEFAULT_GROUP_FORM_CONTROLS };
    }
  }

  openAddBill() {
    if (this.api.activeGroup()?.status === 'INACTIVE') {
      alert('This space is currently inactive (archived/read-only). An Admin must reactivate it before bills can be added.');
      return;
    }
    if (this.isCurrentMemberPending()) {
      alert('Your join request is awaiting Admin approval. You cannot add bills until approved.');
      return;
    }
    this.showAddModal.set(true);
  }

  openSheetEntry() {
    if (this.api.activeGroup()?.status === 'INACTIVE') {
      alert('This space is currently inactive (archived/read-only). An Admin must reactivate it before bulk entries can be added.');
      return;
    }
    if (this.isCurrentMemberPending()) {
      alert('Your join request is awaiting Admin approval. You cannot add bills until approved.');
      return;
    }
    this.showBulkModal.set(true);
  }

  approve(email: string) {
    const grp = this.api.activeGroup();
    if (!grp) return;
    this.api.approveMember(grp.id, email).subscribe({
      next: () => {
        this.api.refreshGroupData(grp.id);
      },
    });
  }

  reject(email: string) {
    const grp = this.api.activeGroup();
    if (!grp) return;
    if (confirm(`Reject membership request for ${email}?`)) {
      this.api.rejectMember(grp.id, email).subscribe({
        next: () => {
          this.api.refreshGroupData(grp.id);
        },
      });
    }
  }

  setRole(email: string, role: 'ADMIN' | 'MEMBER') {
    const grp = this.api.activeGroup();
    if (!grp) return;
    this.api.updateMemberRole(grp.id, email, role).subscribe({
      next: () => {
        this.api.refreshGroupData(grp.id);
      },
    });
  }

  createGroupSubmit() {
    if (!this.newGroupName.trim()) return;
    this.modalLoading.set(true);
    this.modalError.set(null);

    this.api.createGroup(this.newGroupName.trim(), this.newGroupCurrency).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.showCreateModal.set(false);
        this.newGroupName = '';
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(err.error?.error || 'Failed to create group');
      },
    });
  }

  joinGroupSubmit() {
    if (!this.joinInviteCode.trim()) return;
    this.modalLoading.set(true);
    this.modalError.set(null);
    this.modalSuccess.set(null);

    this.api.joinGroup(this.joinInviteCode.trim()).subscribe({
      next: (res: any) => {
        this.modalLoading.set(false);
        if (res.pendingApproval) {
          this.modalSuccess.set(res.message);
          setTimeout(() => {
            this.showJoinModal.set(false);
            this.joinInviteCode = '';
            this.modalSuccess.set(null);
          }, 1800);
        } else {
          this.showJoinModal.set(false);
          this.joinInviteCode = '';
        }
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(err.error?.error || 'Failed to join group. Check code.');
      },
    });
  }

  removeMemberConfirm(email: string, name: string) {
    const group = this.api.activeGroup();
    if (!group) return;
    if (confirm(`Remove ${name} (${email}) from ${group.name}? Their pending invites will also be revoked.`)) {
      this.api.removeMember(group.id, email).subscribe({
        next: () => alert(`Removed ${name} from this space.`),
        error: (err) => alert(err.error?.error || 'Failed to remove member.'),
      });
    }
  }

  copyCode() {
    const code = this.api.activeGroup()?.inviteCode;
    if (code) {
      navigator.clipboard.writeText(code);
      this.copiedCode.set(true);
      setTimeout(() => this.copiedCode.set(false), 2000);
    }
  }

  shareInvite() {
    const group = this.api.activeGroup();
    if (!group) return;
    const msg = `Hey! Join our group "${group.name}" on Group Expense Tracker to easily split bills:\nInvite Code: *${group.inviteCode}*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  toggleVacation() {
    if (!this.api.activeGroup() || this.togglingVacation()) return;
    this.togglingVacation.set(true);
    this.api.toggleAway(!this.isAway()).subscribe({
      next: () => {
        this.togglingVacation.set(false);
      },
      error: () => {
        this.togglingVacation.set(false);
      },
    });
  }

  markSettled(tx: any) {
    this.api.recordSettlement(tx.toUserEmail, tx.amountDisplay, 'Settled up').subscribe({
      next: () => alert('Settlement recorded! Balances updated.'),
    });
  }

  deleteExpense(id: string) {
    if (confirm('Delete this expense?')) {
      this.api.deleteExpense(id).subscribe();
    }
  }

  getCategoryIcon(category: string): string {
    const cat = (category || '').toLowerCase();
    if (
      cat.includes('food') ||
      cat.includes('dining') ||
      cat.includes('grocer') ||
      cat.includes('swiggy') ||
      cat.includes('zomato')
    )
      return '🍽️';
    if (
      cat.includes('bill') ||
      cat.includes('util') ||
      cat.includes('power') ||
      cat.includes('gas') ||
      cat.includes('electric') ||
      cat.includes('water') ||
      cat.includes('internet') ||
      cat.includes('rent')
    )
      return '⚡';
    if (
      cat.includes('transit') ||
      cat.includes('travel') ||
      cat.includes('commute') ||
      cat.includes('cab') ||
      cat.includes('uber') ||
      cat.includes('flight')
    )
      return '🚗';
    if (
      cat.includes('shop') ||
      cat.includes('lifestyle') ||
      cat.includes('apparel') ||
      cat.includes('fashion') ||
      cat.includes('electronic')
    )
      return '🛍️';
    if (
      cat.includes('entertain') ||
      cat.includes('leisure') ||
      cat.includes('movie') ||
      cat.includes('subscription') ||
      cat.includes('sport')
    )
      return '🎬';
    if (
      cat.includes('health') ||
      cat.includes('well') ||
      cat.includes('pharmacy') ||
      cat.includes('doctor') ||
      cat.includes('gym')
    )
      return '💊';
    if (
      cat.includes('educat') ||
      cat.includes('work') ||
      cat.includes('course') ||
      cat.includes('book') ||
      cat.includes('tool')
    )
      return '📚';
    if (
      cat.includes('transfer') ||
      cat.includes('adjust') ||
      cat.includes('settle') ||
      cat.includes('repay') ||
      cat.includes('invest')
    )
      return '🔄';
    return '📦';
  }

  // --- Persistent Space Invites & WhatsApp Actions ---
  openInviteModal() {
    this.inviteName = '';
    this.inviteEmail = '';
    this.inviteError.set(null);
    this.inviteSuccessUrl.set(null);
    this.copiedInvite.set(false);
    this.showInviteModal.set(true);
  }

  sendInviteSubmit() {
    const group = this.api.activeGroup();
    if (!group) return;

    if (!this.inviteEmail.trim()) {
      this.inviteError.set('Please provide the roommate’s email address.');
      return;
    }

    this.inviteLoading.set(true);
    this.inviteError.set(null);

    this.api
      .generateSpaceInvite(group.id, this.inviteEmail.trim(), this.inviteName.trim() || undefined)
      .subscribe({
        next: (res) => {
          this.inviteLoading.set(false);
          this.inviteSuccessUrl.set(res.inviteUrl);
        },
        error: (err) => {
          this.inviteLoading.set(false);
          this.inviteError.set(err.error?.error || 'Failed to generate invite link.');
        },
      });
  }

  copyGeneratedInviteLink() {
    const url = this.inviteSuccessUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    this.copiedInvite.set(true);
    setTimeout(() => this.copiedInvite.set(false), 2000);
  }

  shareInviteOnWhatsApp() {
    const url = this.inviteSuccessUrl();
    const group = this.api.activeGroup();
    if (!url || !group) return;
    const msg = `Hey! Join our shared space "${group.name}" on Bhagabhagi to track and split expenses with us:\n\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  openTenancyModal(m: GroupMember) {
    this.tenancyTargetMember = m;
    this.tenancyMoveInDate = m.movedInAt || m.joinedAt.slice(0, 10);
    this.tenancyMoveOutDate = m.movedOutAt || '';
    this.tenancyError.set(null);
    this.showTenancyModal.set(true);
  }

  saveTenancySubmit() {
    const group = this.api.activeGroup();
    if (!group || !this.tenancyTargetMember) return;

    this.tenancyLoading.set(true);
    this.tenancyError.set(null);

    this.api
      .updateMemberTenancy(group.id, this.tenancyTargetMember.userEmail, {
        moved_in_at: this.tenancyMoveInDate,
        moved_out_at: this.tenancyMoveOutDate ? this.tenancyMoveOutDate : null,
      })
      .subscribe({
        next: () => {
          this.tenancyLoading.set(false);
          this.showTenancyModal.set(false);
        },
        error: (err) => {
          this.tenancyLoading.set(false);
          this.tenancyError.set(err.error?.error || 'Failed to update tenancy.');
        },
      });
  }

  clearMoveOutDate() {
    this.tenancyMoveOutDate = '';
  }

  toggleMemberStatus(m: GroupMember) {
    const group = this.api.activeGroup();
    if (!group) return;
    const currentStatus = m.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'INACTIVE' ? 'deactivate' : 'activate';

    if (confirm(`Are you sure you want to ${actionLabel} ${m.name}? ${newStatus === 'INACTIVE' ? 'They will be paused from participating in new expenses.' : 'They will be active again.'}`)) {
      this.api.updateMemberStatus(group.id, m.userEmail, newStatus).subscribe({
        next: () => {
          this.api.refreshGroupData(group.id);
        },
        error: (err) => {
          alert(err.error?.error || `Failed to update status for ${m.name}`);
        },
      });
    }
  }

  toggleSpaceStatus() {
    const group = this.api.activeGroup();
    if (!group) return;
    const currentStatus = group.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const msg =
      newStatus === 'INACTIVE'
        ? `Deactivate / Archive "${group.name}"?\n\nThe space will become read-only: no new expenses can be added until reactivated, but past statements and ledger debts remain accessible.`
        : `Reactivate "${group.name}"?\n\nMembers will be able to log expenses and split bills again.`;

    if (confirm(msg)) {
      this.api.updateGroupStatus(group.id, newStatus).subscribe({
        next: () => {
          this.api.refreshGroupData(group.id);
        },
        error: (err) => {
          alert(err.error?.error || 'Failed to update space status.');
        },
      });
    }
  }

  openDeleteSpaceModal() {
    this.showGroupMenu.set(false);
    this.deleteConfirmInput = '';
    this.deleteSpaceError.set(null);
    this.deleteSpaceLoading.set(false);
    this.showDeleteSpaceModal.set(true);
  }

  confirmDeleteSpaceSubmit() {
    const group = this.api.activeGroup();
    if (!group) return;

    if (this.deleteConfirmInput.trim().toLowerCase() !== group.name.trim().toLowerCase()) {
      this.deleteSpaceError.set(`Name does not match. Please type exactly "${group.name}".`);
      return;
    }

    this.deleteSpaceLoading.set(true);
    this.deleteSpaceError.set(null);

    this.api.deleteGroup(group.id, this.deleteConfirmInput.trim()).subscribe({
      next: () => {
        this.deleteSpaceLoading.set(false);
        this.showDeleteSpaceModal.set(false);
        alert(`Space "${group.name}" has been permanently deleted.`);
        this.api.fetchUserGroups().subscribe({
          next: (res) => {
            if (!res.memberships || res.memberships.length === 0) {
              this.router.navigate(['/onboarding']);
            }
          },
        });
      },
      error: (err) => {
        this.deleteSpaceLoading.set(false);
        this.deleteSpaceError.set(err.error?.error || 'Failed to delete space.');
      },
    });
  }
}
