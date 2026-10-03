import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
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
      class="min-h-screen max-w-md sm:max-w-lg md:max-w-2xl mx-auto bg-slate-50 text-slate-900 flex flex-col shadow-xs relative border-x border-slate-200/80 font-sans"
    >
      <!-- Top Mature Executive Header -->
      <header
        class="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-30 px-3.5 py-2.5 pt-safe shadow-2xs"
      >
        <div class="flex items-center justify-between relative">
          <!-- Left: Group Switcher Trigger Pill -->
          <div
            (click)="showGroupMenu.set(!showGroupMenu())"
            class="flex items-center space-x-2 py-1 px-2 -ml-1 rounded-xl hover:bg-slate-100 active:scale-98 transition-all cursor-pointer select-none group"
            title="Switch or manage groups"
          >
            <!-- Group Icon -->
            <div
              class="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs flex-shrink-0 transition-colors"
            >
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            <!-- Group Title & Chevron -->
            <div class="flex items-center space-x-1.5 min-w-0">
              <h1
                class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 leading-none truncate max-w-[130px] sm:max-w-[190px] transition-colors"
              >
                {{ api.activeGroup()?.name || 'My Group' }}
              </h1>
              <span class="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors"
                >▾</span
              >
            </div>

            <!-- Google Sheet Live Indicator -->
            <span
              class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
              title="Google Sheet live sync active"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              Live
            </span>
          </div>

          <!-- Right: Action Bar (Invite Pill + User + Logout) -->
          <div class="flex items-center space-x-2">
            <!-- Compact Invite Code Pill -->
            <button
              type="button"
              (click)="copyCode()"
              class="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 active:scale-95 border border-slate-200/80 rounded-lg text-xs transition-all cursor-pointer select-none"
              [title]="copiedCode() ? 'Copied!' : 'Click to copy invite code'"
            >
              <span
                class="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden xs:inline"
                >Code:</span
              >
              <span class="font-mono font-bold text-slate-700 text-xs">{{
                api.activeGroup()?.inviteCode
              }}</span>
              <span class="text-[10px] text-slate-500">{{ copiedCode() ? '✓' : '📋' }}</span>
            </button>

            <!-- User Avatar & Direct Log Out -->
            <div class="flex items-center space-x-2 pl-1 border-l border-slate-200">
              <div class="hidden md:block text-right leading-none">
                <p class="text-xs font-bold text-slate-800 truncate max-w-[80px]">
                  {{ api.currentUser()?.name }}
                </p>
              </div>

              <button
                (click)="api.logout(); router.navigate(['/auth'])"
                class="text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Log out"
              >
                Log out
              </button>

              <div
                class="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 select-none shadow-2xs"
                [title]="api.currentUser()?.email || ''"
              >
                {{ api.currentUser()?.name?.charAt(0) || 'U' }}
              </div>
            </div>
          </div>

          <!-- Group Switcher Dropdown Menu -->
          <div
            *ngIf="showGroupMenu()"
            class="absolute top-12 left-0 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div
              class="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100"
            >
              <span>Your Groups ({{ api.userGroups().length }})</span>
              <button
                (click)="showGroupMenu.set(false)"
                class="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Group list -->
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
                      Admin
                    </span>
                    <span
                      *ngIf="ug.status === 'PENDING'"
                      class="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold rounded"
                    >
                      Pending
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 font-mono mt-0.5">
                    Code: {{ ug.group.inviteCode }}
                  </p>
                </div>
                <span
                  *ngIf="api.activeGroup()?.id === ug.group.id"
                  class="text-indigo-600 font-bold text-sm"
                  >✓</span
                >
              </div>
            </div>

            <!-- Quick group actions -->
            <div class="pt-1.5 border-t border-slate-100 space-y-1">
              <button
                (click)="showGroupMenu.set(false); showCreateModal.set(true)"
                class="w-full py-2 px-3 text-left text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>＋</span>
                <span>Create New Group</span>
              </button>
              <button
                (click)="showGroupMenu.set(false); showJoinModal.set(true)"
                class="w-full py-2 px-3 text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <span>🔗</span>
                <span>Join Another Group</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Scrollable Body -->
      <main class="flex-1 p-4 space-y-4 pb-28 overflow-y-auto">
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
            <div class="flex items-center space-x-2 text-slate-600">
              <svg
                class="w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span class="font-semibold text-xs">Vacation Mode</span>
            </div>
            <button
              (click)="toggleVacation()"
              class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
              [class.bg-amber-600]="isAway()"
              [class.text-white]="isAway()"
              [class.bg-slate-100]="!isAway()"
              [class.text-slate-700]="!isAway()"
              [class.border]="!isAway()"
              [class.border-slate-300]="!isAway()"
            >
              {{ isAway() ? 'Away (Excluded)' : 'At Group (Active)' }}
            </button>
          </div>
        </div>

        <!-- QUICK ACTIONS BAR (Includes Google Sheet Multiple Entry) -->
        <div class="grid grid-cols-4 sm:grid-cols-5 gap-2">
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

          <!-- Action: Multiple Entry (Google Sheet Mode) -->
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
            <span class="text-[10px] font-bold text-emerald-800">Sheet Entry</span>
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

          <!-- Action: Share WhatsApp -->
          <button
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

        <!-- SUGGESTED SETTLEMENTS (Min-Cash-Flow) -->
        <div class="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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

        <!-- GROUP MEMBERS & ADMIN MANAGEMENT -->
        <div class="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div class="flex justify-between items-center">
            <h3
              class="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>👥</span>
              <span>Group Members ({{ activeMembers().length }})</span>
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
                👑 Admin
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

                <!-- If caller is admin: tenancy update & promote/demote -->
                <ng-container
                  *ngIf="isAdmin() && m.status !== 'PENDING'"
                >
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
                    *ngIf="m.role === 'ADMIN' && m.userEmail !== api.currentUser()?.email"
                    (click)="setRole(m.userEmail, 'MEMBER')"
                    class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded-lg cursor-pointer transition-colors"
                    title="Demote to standard Member"
                  >
                    Make Member
                  </button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN GROUP EXPENSE ENTRY FORM CONTROLS -->
        <div
          *ngIf="isAdmin()"
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

        <!-- RECENT GROUP EXPENSES FEED -->
        <div class="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
            <p>No bills logged yet. Tap ＋ Add Bill or Sheet Entry above!</p>
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

        <!-- Multiple Entry (Sheet View) Tab -->
        <button
          (click)="openSheetEntry()"
          class="flex flex-col items-center justify-center text-emerald-700 hover:text-emerald-800 active:scale-90 transition-transform cursor-pointer"
        >
          <span class="text-lg">📊</span>
          <span class="text-[10px] font-bold">Sheet</span>
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

      <!-- Invite Roommate with Move-In Date Modal -->
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

          <div
            *ngIf="inviteSuccessCode()"
            class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl space-y-2"
          >
            <p class="font-bold text-emerald-800">✅ Invite Created!</p>
            <p class="text-[11px] text-slate-600">Share this code with your flatmate:</p>
            <div class="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-200 font-mono text-xs font-bold text-emerald-700">
              <span>{{ inviteSuccessCode() }}</span>
              <button
                type="button"
                (click)="copyInviteLink()"
                class="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] cursor-pointer"
              >
                {{ copiedInvite() ? 'Copied!' : 'Copy Code' }}
              </button>
            </div>
          </div>

          <form *ngIf="!inviteSuccessCode()" (ngSubmit)="sendInviteSubmit()" class="space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Roommate Name</label>
              <input
                type="text"
                [(ngModel)]="inviteName"
                name="inviteName"
                required
                placeholder="e.g. Priya Sharma"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                [(ngModel)]="inviteEmail"
                name="inviteEmail"
                required
                placeholder="e.g. priya@gmail.com"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="space-y-1">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Effective Move-In Date</span>
                <span class="text-[10px] text-indigo-600 font-semibold">Liabilities start from this date</span>
              </label>
              <input
                type="date"
                [(ngModel)]="inviteMoveInDate"
                name="inviteMoveInDate"
                required
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              [disabled]="inviteLoading() || !inviteName.trim() || !inviteEmail.trim() || !inviteMoveInDate"
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
            >
              {{ inviteLoading() ? 'Generating Invite...' : 'Generate Personalized Invite' }}
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
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Move-Out Date (Vacated)</span>
                <span class="text-[10px] text-slate-400">Leave blank if residing</span>
              </label>
              <input
                type="date"
                [(ngModel)]="tenancyMoveOutDate"
                name="tenancyMoveOutDate"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <p class="text-[10px] text-slate-500">
                Setting a move-out date marks this flatmate as left. They won't be charged for subsequent bills.
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
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  showAddModal = signal<boolean>(false);
  showBulkModal = signal<boolean>(false);
  copiedCode = signal<boolean>(false);

  showGroupMenu = signal<boolean>(false);
  showCreateModal = signal<boolean>(false);
  showJoinModal = signal<boolean>(false);

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

  constructor(
    public api: ApiService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.api.fetchUserGroups().subscribe({
      next: () => {
        const active = this.api.activeGroup();
        if (active?.formControls) {
          this.formControlsConfig = { ...active.formControls };
        }
      },
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
    if (this.isCurrentMemberPending()) {
      alert('Your join request is awaiting Admin approval. You cannot add bills until approved.');
      return;
    }
    this.showAddModal.set(true);
  }

  openSheetEntry() {
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
    this.api.toggleAway(!this.isAway()).subscribe();
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

  // --- Tenancy & Invite Actions ---
  openInviteModal() {
    this.inviteName = '';
    this.inviteEmail = '';
    this.inviteMoveInDate = new Date().toISOString().slice(0, 10);
    this.inviteError.set(null);
    this.inviteSuccessCode.set(null);
    this.copiedInvite.set(false);
    this.showInviteModal.set(true);
  }

  sendInviteSubmit() {
    const group = this.api.activeGroup();
    if (!group) return;

    if (!this.inviteName.trim() || !this.inviteEmail.trim() || !this.inviteMoveInDate) {
      this.inviteError.set('Please fill out all fields.');
      return;
    }

    this.inviteLoading.set(true);
    this.inviteError.set(null);

    this.api
      .createGroupInvite(group.id, {
        invitee_name: this.inviteName.trim(),
        invitee_email: this.inviteEmail.trim(),
        effective_move_in_date: this.inviteMoveInDate,
      })
      .subscribe({
        next: (res) => {
          this.inviteLoading.set(false);
          this.inviteSuccessCode.set(res.inviteCode);
        },
        error: (err) => {
          this.inviteLoading.set(false);
          this.inviteError.set(err.error?.error || 'Failed to create invite.');
        },
      });
  }

  copyInviteLink() {
    const code = this.inviteSuccessCode();
    if (!code) return;
    navigator.clipboard.writeText(code);
    this.copiedInvite.set(true);
    setTimeout(() => this.copiedInvite.set(false), 2000);
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
}
