import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
import { AddExpenseModalComponent } from '../expenses/add-expense-modal.component.js';
import { BulkExpenseGridComponent } from '../expenses/bulk-expense-grid.component.js';
import { Group } from '@shared-expense-tracker/shared';

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
        class="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 pt-safe shadow-xs"
      >
        <div class="flex items-center justify-between relative">
          <!-- Group Brand & Dropdown Switcher -->
          <div class="flex items-center space-x-3">
            <div
              (click)="showGroupMenu.set(!showGroupMenu())"
              class="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0 cursor-pointer transition-colors"
              title="Switch Group"
            >
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <div
                (click)="showGroupMenu.set(!showGroupMenu())"
                class="flex items-center space-x-1.5 cursor-pointer group select-none"
              >
                <h1
                  class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 leading-tight truncate max-w-[140px] sm:max-w-[200px] transition-colors"
                >
                  {{ api.activeGroup()?.name || 'My Group' }}
                </h1>
                <span class="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors"
                  >▾</span
                >
                <!-- Google Sheet Sync Status -->
                <span
                  class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  title="Changes mirror automatically to Google Sheets"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Synced
                </span>
              </div>
              <div class="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                <span class="font-medium text-slate-500">Code:</span>
                <span
                  class="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[11px]"
                >
                  {{ api.activeGroup()?.inviteCode }}
                </span>
                <button
                  (click)="copyCode()"
                  class="text-slate-400 hover:text-slate-700 active:scale-90 transition-transform cursor-pointer"
                  [title]="copiedCode() ? 'Copied!' : 'Copy Code'"
                >
                  <span *ngIf="!copiedCode()" class="text-xs">📋</span>
                  <span *ngIf="copiedCode()" class="text-xs text-emerald-600 font-bold">✓</span>
                </button>
              </div>
            </div>
          </div>

          <!-- User Pill & Log Out -->
          <div class="flex items-center space-x-2.5">
            <div class="text-right">
              <p
                class="text-xs font-bold text-slate-800 leading-none truncate max-w-[85px] sm:max-w-none"
              >
                {{ api.currentUser()?.name }}
              </p>
              <button
                (click)="api.logout(); router.navigate(['/auth'])"
                class="text-[11px] text-slate-400 font-semibold hover:text-rose-600 transition-colors cursor-pointer mt-0.5 inline-block"
              >
                Log out
              </button>
            </div>
            <div
              class="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0"
            >
              {{ api.currentUser()?.name?.charAt(0) || 'U' }}
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
            <span
              *ngIf="isAdmin()"
              class="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full"
            >
              👑 You are Admin
            </span>
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
                  <div class="flex items-center space-x-1.5">
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

                <!-- If member is active and caller is admin: promote/demote -->
                <ng-container
                  *ngIf="
                    isAdmin() && m.status !== 'PENDING' && m.userEmail !== api.currentUser()?.email
                  "
                >
                  <button
                    *ngIf="m.role === 'MEMBER'"
                    (click)="setRole(m.userEmail, 'ADMIN')"
                    class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                    title="Make this member an Admin"
                  >
                    👑 Make Admin
                  </button>
                  <button
                    *ngIf="m.role === 'ADMIN'"
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
                  • {{ exp.category }} •
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

  constructor(
    public api: ApiService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.api.fetchUserGroups().subscribe();
  }

  switchGroup(group: Group) {
    this.api.setActiveGroup(group);
    this.showGroupMenu.set(false);
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
    const cat = category.toLowerCase();
    if (
      cat.includes('grocer') ||
      cat.includes('blinkit') ||
      cat.includes('zepto') ||
      cat.includes('instamart')
    )
      return '🛒';
    if (
      cat.includes('food') ||
      cat.includes('zomato') ||
      cat.includes('swiggy') ||
      cat.includes('dining')
    )
      return '🍕';
    if (
      cat.includes('util') ||
      cat.includes('wifi') ||
      cat.includes('electric') ||
      cat.includes('gas')
    )
      return '⚡';
    if (cat.includes('rent') || cat.includes('maid') || cat.includes('cook')) return '🏠';
    if (cat.includes('travel') || cat.includes('uber') || cat.includes('ola')) return '🚗';
    return '🧾';
  }
}
