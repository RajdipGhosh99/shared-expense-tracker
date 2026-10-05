import { Component, EventEmitter, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service.js';
import { AiCategoryService, AiPrediction } from '../../core/services/ai-category.service.js';
import {
  DuplicateConflictResponse,
  ExpenseCategory,
  SplitType,
  CATEGORY_TAXONOMY,
  DEFAULT_GROUP_FORM_CONTROLS,
  EligibleMember,
} from '@shared-expense-tracker/shared';

@Component({
  selector: 'app-add-expense-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Mobile Bottom Sheet Backdrop -->
    <div
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end z-50 transition-opacity"
    >
      <!-- Click backdrop to close -->
      <div class="flex-1" (click)="close.emit()"></div>

      <!-- Sheet Container -->
      <div
        class="bg-white rounded-t-3xl max-w-md w-full mx-auto p-5 pb-8 shadow-2xl border-t border-slate-200 animate-slide-up max-h-[90vh] overflow-y-auto space-y-4 text-slate-900"
      >
        <!-- Mobile Drag Handle -->
        <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

        <!-- Modal Header with Integrated Bulk Entry Action -->
        <div class="flex justify-between items-center pb-3 border-b border-slate-100">
          <div class="flex items-center space-x-2.5">
            <div
              class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs text-sm font-bold flex-shrink-0"
            >
              ＋
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 leading-tight">Add Group Expense</h3>
              <p class="text-[11px] text-slate-500">Split automatically with active members</p>
            </div>
          </div>

          <!-- Header Right Actions: Bulk Entry Button & Close Icon -->
          <div class="flex items-center space-x-2">
            <button
              type="button"
              (click)="openBulk.emit()"
              class="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Open spreadsheet bulk entry"
            >
              <span>📊</span>
              <span>Bulk Entry</span>
            </button>
            <button
              type="button"
              (click)="close.emit()"
              class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 font-bold active:scale-90 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- DUPLICATE CONFLICT POPUP (If triggered) -->
        <div
          *ngIf="conflictData()"
          class="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3"
        >
          <div class="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <span>⚠️ Duplicate Payment Detected</span>
          </div>
          <p class="text-xs text-amber-900 leading-relaxed">{{ conflictData()?.message }}</p>

          <!-- Linked ID Card -->
          <div class="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1 shadow-xs">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-700">Existing Record:</span>
              <span
                class="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold rounded border border-indigo-200"
              >
                #{{ conflictData()?.existingRecord?.id }}
              </span>
            </div>
            <p>
              <span class="text-slate-500">Title:</span> {{ conflictData()?.existingRecord?.title }}
            </p>
            <p>
              <span class="text-slate-500">Amount:</span> ₹{{
                conflictData()?.existingRecord?.amountDisplay
              }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button
              (click)="conflictData.set(null)"
              class="py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
            >
              Cancel
            </button>
            <button
              (click)="submitWithOverwrite()"
              class="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
            >
              Overwrite #{{ conflictData()?.existingRecord?.id }}
            </button>
          </div>
        </div>

        <!-- Main Form -->
        <form *ngIf="!conflictData()" (ngSubmit)="submit()" class="space-y-3.5">
          <!-- Big Mobile Amount Input -->
          <div
            class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all"
          >
            <label
              class="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center space-x-1"
            >
              <span>Amount</span>
              <span class="text-[10px] text-rose-600 font-extrabold">*</span>
            </label>
            <div class="flex items-center justify-center text-slate-900 font-black text-3xl">
              <span class="text-slate-400 mr-1.5 text-2xl font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                [(ngModel)]="amount"
                name="amount"
                required
                placeholder="0.00"
                class="w-48 bg-transparent text-center font-black focus:outline-none placeholder-slate-300"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>What is this for?</span>
              <span class="text-[10px] text-rose-600 font-extrabold">* Mandatory</span>
            </label>
            <input
              type="text"
              [(ngModel)]="title"
              (ngModelChange)="onTitleChange($event)"
              (blur)="titleTouched.set(true)"
              name="title"
              required
              placeholder="e.g. Blinkit Groceries, Wi-Fi, Swiggy dinner"
              class="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none bg-white text-slate-900 placeholder-slate-400 transition-all"
              [class.border-slate-200]="!titleTouched() || (title && title.trim().length > 0)"
              [class.focus:border-indigo-500]="!titleTouched() || (title && title.trim().length > 0)"
              [class.focus:ring-indigo-500]="!titleTouched() || (title && title.trim().length > 0)"
              [class.border-rose-400]="titleTouched() && (!title || title.trim().length === 0)"
              [class.bg-rose-50/20]="titleTouched() && (!title || title.trim().length === 0)"
              [class.focus:border-rose-500]="titleTouched() && (!title || title.trim().length === 0)"
              [class.focus:ring-rose-500]="titleTouched() && (!title || title.trim().length === 0)"
            />
            <!-- Title validation feedback for empty / whitespace-only input -->
            <p
              *ngIf="titleTouched() && (!title || title.trim().length === 0)"
              class="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 animate-fade-in"
            >
              <span>⚠️</span>
              <span>Please enter a title (cannot be empty or spaces only).</span>
            </p>
            <!-- Real-time AI Suggested Category Badge -->
            <div
              *ngIf="aiSuggestion() && aiSuggestion()?.matchedKeyword"
              class="flex flex-wrap items-center gap-1.5 pt-0.5"
            >
              <div
                class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-2xs animate-fade-in"
              >
                <span>✨ AI Suggested:</span>
                <span class="font-bold text-indigo-900">{{ aiSuggestion()?.category }}</span>
                <span *ngIf="aiSuggestion()?.subCategory" class="text-indigo-600 font-medium"
                  >› {{ aiSuggestion()?.subCategory }}</span
                >
                <span class="text-[10px] text-indigo-500 font-normal">
                  ({{
                    aiSuggestion()?.matchReason ||
                      'Matched "' + aiSuggestion()?.matchedKeyword + '"'
                  }})
                </span>
              </div>
            </div>
          </div>

          <!-- Date Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Date</span>
              <span
                *ngIf="controls().date === 'mandatory'"
                class="text-[10px] text-rose-600 font-extrabold tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                >* Mandatory</span
              >
            </label>
            <input
              type="date"
              [(ngModel)]="date"
              (ngModelChange)="onDateChange($event)"
              name="date"
              [required]="controls().date === 'mandatory'"
              [disabled]="controls().date === 'view_only'"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-slate-900 transition-all disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <!-- Category & Subcategory Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- Category -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Category</span>
                <span
                  *ngIf="controls().category === 'mandatory'"
                  class="text-[10px] text-rose-600 font-extrabold"
                  >* Mandatory</span
                >
              </label>
              <select
                [(ngModel)]="category"
                (ngModelChange)="onCategoryChange($event)"
                name="category"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white text-slate-800 transition-all"
              >
                <option value="Food & Dining">🍔 Food & Dining</option>
                <option value="Bills & Utilities">⚡ Bills & Utilities</option>
                <option value="Transit & Travel">🚗 Transit & Travel</option>
                <option value="Shopping & Lifestyle">🛍️ Shopping & Lifestyle</option>
                <option value="Entertainment & Leisure">🎬 Entertainment & Leisure</option>
                <option value="Health & Wellness">💊 Health & Wellness</option>
                <option value="Education & Work">📚 Education & Work</option>
                <option value="Transfers & Adjustments">🔄 Transfers & Adjustments</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>

            <!-- Notice for Transfers & Adjustments (isExpense: false) -->
            <div
              *ngIf="
                category === 'Transfers & Adjustments' || category === 'Transfers & Settlements'
              "
              class="col-span-full p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center space-x-2"
            >
              <span>ℹ️</span>
              <span class="leading-tight">
                <strong>Transfers & Adjustments</strong> are debt settlements / repayments (<code
                  >isExpense: false</code
                >) and will never inflate monthly consumption analytics.
              </span>
            </div>

            <!-- Subcategory (Mapped to Main Category) -->
            <div *ngIf="controls().subCategory !== 'hidden'" class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Subcategory</span>
                <span
                  *ngIf="controls().subCategory === 'mandatory'"
                  class="text-[10px] text-rose-600 font-extrabold tracking-wider bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                  >* Mandatory</span
                >
                <span
                  *ngIf="controls().subCategory === 'editable'"
                  class="text-[10px] text-slate-400 font-medium"
                  >Optional</span
                >
              </label>
              <select
                [(ngModel)]="subCategory"
                name="subCategory"
                [required]="controls().subCategory === 'mandatory'"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white text-slate-800 transition-all"
              >
                <option *ngFor="let sub of availableSubcategories()" [value]="sub">
                  • {{ sub }}
                </option>
              </select>
            </div>
          </div>

          <!-- Paid By & Split Method Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <!-- Paid By: Can be ME or other active user on that day -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Paid By</span>
                <span class="text-[10px] text-indigo-600 font-medium">
                  {{ isCurrentUserPayer() ? 'Paid by You' : 'Paid on behalf' }}
                </span>
              </label>
              <select
                [(ngModel)]="payerEmail"
                name="payerEmail"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white text-slate-800 transition-all cursor-pointer"
              >
                <!-- Current User Option -->
                <option [value]="currentUserEmail()">
                  👤 You ({{ currentUserDisplayName() }})
                </option>
                <!-- Other Active Flatmates On That Day -->
                <ng-container *ngFor="let m of activeEligibleMembers()">
                  <option
                    *ngIf="m.userEmail.toLowerCase() !== currentUserEmail().toLowerCase()"
                    [value]="m.userEmail"
                  >
                    👤 {{ m.name }} ({{ m.userEmail }})
                  </option>
                </ng-container>
              </select>
            </div>

            <!-- Split Method -->
            <div *ngIf="controls().splitType !== 'hidden'" class="space-y-1.5">
              <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Split Method</span>
                <span
                  *ngIf="controls().splitType === 'view_only'"
                  class="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 font-bold"
                  >Locked: Equal</span
                >
              </label>

              <div
                *ngIf="controls().splitType === 'view_only'"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-semibold flex items-center space-x-1.5"
              >
                <span>🔒 Equal Split (Set by Group Admin)</span>
              </div>

              <select
                *ngIf="controls().splitType !== 'view_only'"
                [(ngModel)]="splitType"
                name="splitType"
                (ngModelChange)="onSplitTypeChange()"
                class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white text-slate-800 transition-all"
              >
                <option value="EXACT">Exact Amounts (Default)</option>
                <option value="EQUAL">Equal Split</option>
                <option value="PERCENTAGE">Percentages</option>
                <option value="SHARES">Shares / Ratio</option>
                <option value="PERSONAL">Personal (No Split)</option>
              </select>
            </div>
          </div>

          <!-- Notes / Description -->
          <div *ngIf="controls().notes !== 'hidden'" class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Notes / Memo</span>
              <span
                *ngIf="controls().notes === 'mandatory'"
                class="text-[10px] text-rose-600 font-extrabold"
                >* Mandatory</span
              >
              <span
                *ngIf="controls().notes === 'editable'"
                class="text-[10px] text-slate-400 font-medium"
                >Optional</span
              >
            </label>
            <input
              type="text"
              [(ngModel)]="notes"
              name="notes"
              [required]="controls().notes === 'mandatory'"
              placeholder="e.g. Sunday flat lunch"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 bg-white text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>

          <!-- Roommate Split for Expense Date (Tenancy & Move-in Aware) -->
          <div class="space-y-2 pt-1 border-t border-slate-100">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <span>👥</span>
                <span>Roommate Split for {{ date }}</span>
              </span>
              <span class="text-[11px] font-semibold text-slate-500">
                {{ effectiveParticipants().length }} active
              </span>
            </div>

            <!-- Loading indicator -->
            <div *ngIf="loadingEligibility()" class="p-2 text-center text-xs text-slate-400">
              Checking active flatmates for {{ date }}...
            </div>

            <!-- Roommate list -->
            <div *ngIf="!loadingEligibility() && eligibleMembers().length > 0" class="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
              <div
                *ngFor="let m of eligibleMembers()"
                class="flex items-center justify-between p-2 rounded-xl border text-xs transition-all"
                [class.border-indigo-100]="(m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE') && !isExcluded(m.userEmail)"
                [class.bg-indigo-50/40]="(m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE') && !isExcluded(m.userEmail)"
                [class.border-slate-100]="isExcluded(m.userEmail) || m.eligibilityStatus === 'NOT_YET_MOVED_IN' || m.eligibilityStatus === 'MOVED_OUT'"
                [class.bg-slate-50]="isExcluded(m.userEmail) || m.eligibilityStatus === 'NOT_YET_MOVED_IN' || m.eligibilityStatus === 'MOVED_OUT'"
                [class.opacity-60]="m.eligibilityStatus === 'NOT_YET_MOVED_IN' || m.eligibilityStatus === 'MOVED_OUT'"
              >
                <!-- Member checkbox + Name & Tenancy Badges -->
                <div class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    *ngIf="m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE'"
                    [checked]="!isExcluded(m.userEmail)"
                    (change)="toggleExclude(m.userEmail)"
                    class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <!-- Ineligible placeholder -->
                  <span
                    *ngIf="m.eligibilityStatus === 'NOT_YET_MOVED_IN' || m.eligibilityStatus === 'MOVED_OUT'"
                    class="w-4 h-4 flex items-center justify-center text-slate-300 select-none text-[10px]"
                  >
                    ✕
                  </span>

                  <div>
                    <div class="flex flex-wrap items-center gap-1">
                      <span
                        class="font-semibold text-slate-800"
                        [class.line-through]="isExcluded(m.userEmail) || m.eligibilityStatus === 'MOVED_OUT'"
                      >
                        {{ m.name }}
                      </span>
                      <!-- Pending Invite Badge -->
                      <span
                        *ngIf="m.isPendingInvite"
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        ⏳ [Pending Invite - Effective {{ m.effectiveMoveInDate }}]
                      </span>
                      <!-- Ineligible Tags -->
                      <span
                        *ngIf="m.eligibilityStatus === 'NOT_YET_MOVED_IN'"
                        class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 text-slate-600"
                      >
                        Joined on {{ m.movedInAt }}
                      </span>
                      <span
                        *ngIf="m.eligibilityStatus === 'MOVED_OUT'"
                        class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-100 text-rose-700"
                      >
                        Moved out {{ m.movedOutAt || '' }}
                      </span>
                      <!-- Away Tag -->
                      <span
                        *ngIf="m.isAway && m.eligibilityStatus === 'ACTIVE'"
                        class="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-200 text-slate-600"
                      >
                        🌴 Away
                      </span>
                    </div>
                    <p class="text-[10px] text-slate-400">{{ m.userEmail }}</p>
                  </div>
                </div>

                <!-- Share amount -->
                <div class="text-right">
                  <!-- EXACT mode input -->
                  <div
                    *ngIf="(m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE') && !isExcluded(m.userEmail) && splitType === 'EXACT'"
                    class="flex items-center justify-end space-x-1"
                  >
                    <span class="text-xs font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      [value]="getExactAmount(m.userEmail)"
                      (input)="onExactAmountInput(m.userEmail, $event)"
                      class="w-20 px-2 py-1 text-right font-mono font-bold text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white text-indigo-700 shadow-2xs"
                    />
                  </div>

                  <!-- EQUAL / SHARES / PERCENTAGE mode share -->
                  <span
                    *ngIf="(m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE') && !isExcluded(m.userEmail) && amount && amount > 0 && splitType !== 'EXACT' && splitType !== 'PERSONAL'"
                    class="font-bold text-indigo-700 font-mono text-xs"
                  >
                    ₹{{ perPersonShare().toFixed(2) }}
                  </span>

                  <!-- PERSONAL mode -->
                  <div
                    *ngIf="(m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE') && !isExcluded(m.userEmail) && splitType === 'PERSONAL'"
                  >
                    <span *ngIf="isPayer(m.userEmail)" class="font-bold text-indigo-700 font-mono text-xs">
                      ₹{{ ((amount || 0)).toFixed(2) }} <span class="text-[9px] font-semibold text-indigo-500">(100%)</span>
                    </span>
                    <span *ngIf="!isPayer(m.userEmail)" class="font-medium text-slate-400 font-mono text-xs">
                      ₹0.00 <span class="text-[9px] italic">(No Debt)</span>
                    </span>
                  </div>

                  <span
                    *ngIf="isExcluded(m.userEmail) && (m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE')"
                    class="text-[10px] text-slate-400 font-medium italic"
                  >
                    Excluded
                  </span>
                  <span
                    *ngIf="m.eligibilityStatus === 'NOT_YET_MOVED_IN' || m.eligibilityStatus === 'MOVED_OUT'"
                    class="text-[10px] text-slate-400 italic"
                  >
                    Not residing
                  </span>
                </div>
              </div>
            </div>

            <!-- Summary banner: EQUAL -->
            <div
              *ngIf="amount && amount > 0 && splitType === 'EQUAL' && effectiveParticipants().length > 0"
              class="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between"
            >
              <span class="font-medium text-slate-600">Each Active Roommate Pays:</span>
              <span class="font-black text-indigo-700 text-sm">₹{{ perPersonShare().toFixed(2) }}</span>
            </div>

            <!-- Summary banner: EXACT -->
            <div
              *ngIf="amount && amount > 0 && splitType === 'EXACT' && effectiveParticipants().length > 0"
              class="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between"
            >
              <div class="flex items-center space-x-1.5">
                <span class="font-medium text-slate-600">Total Allocated:</span>
                <span class="font-bold text-indigo-700">₹{{ totalExactAllocated().toFixed(2) }} / ₹{{ ((amount || 0)).toFixed(2) }}</span>
              </div>
              <span
                *ngIf="Math.abs(exactDifference()) > 0.01"
                class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
              >
                {{ exactDifference() > 0 ? 'Remaining: ₹' + exactDifference().toFixed(2) : 'Over: ₹' + (-exactDifference()).toFixed(2) }}
              </span>
              <span
                *ngIf="Math.abs(exactDifference()) <= 0.01"
                class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
              >
                ✓ Balanced
              </span>
            </div>

            <!-- Summary banner: PERSONAL -->
            <div
              *ngIf="amount && amount > 0 && splitType === 'PERSONAL'"
              class="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between"
            >
              <span class="font-medium text-slate-600">Personal (Solo Expense):</span>
              <span class="font-bold text-slate-800">100% borne by {{ isCurrentUserPayer() ? 'You' : payerEmail }} (₹0 flatmate debt)</span>
            </div>
          </div>

          <!-- Error Alert -->
          <div
            *ngIf="errorMessage()"
            class="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-200"
          >
            {{ errorMessage() }}
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all text-white font-bold rounded-xl shadow-xs text-sm cursor-pointer"
          >
            {{ loading() ? 'Saving Expense...' : 'Save & Split Bill' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AddExpenseModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() openBulk = new EventEmitter<void>();

  title = '';
  amount: number | null = null;
  date: string = new Date().toISOString().split('T')[0];
  category: ExpenseCategory = 'Food & Dining';
  subCategory = 'Groceries & Dark Stores';
  notes = '';
  splitType: SplitType = 'EXACT';
  payerEmail = '';
  exactAmounts: Record<string, number> = {};
  isExactManualEdited = false;
  protected readonly Math = Math;

  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  conflictData = signal<DuplicateConflictResponse | null>(null);
  aiSuggestion = signal<AiPrediction | null>(null);

  // Tenancy & Dynamic Member Eligibility
  eligibleMembers = signal<EligibleMember[]>([]);
  loadingEligibility = signal<boolean>(false);
  excludedEmails = signal<Set<string>>(new Set());

  activeEligibleMembers = computed(() =>
    this.eligibleMembers().filter(
      (m) => m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE',
    ),
  );

  currentUserEmail = computed(() => this.api.currentUser()?.email || '');
  currentUserDisplayName = computed(() => this.api.currentUser()?.name || this.currentUserEmail());

  isCurrentUserPayer(): boolean {
    return (
      !this.payerEmail ||
      this.payerEmail.toLowerCase() === this.currentUserEmail().toLowerCase()
    );
  }

  isPayer(email: string): boolean {
    const p = (this.payerEmail || this.currentUserEmail()).toLowerCase();
    return email.toLowerCase() === p;
  }

  getExactAmount(email: string): number {
    const key = email.toLowerCase();
    if (this.exactAmounts[key] !== undefined) {
      return this.exactAmounts[key];
    }
    return this.perPersonShare();
  }

  onExactAmountInput(email: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseFloat(input.value);
    this.isExactManualEdited = true;
    this.exactAmounts[email.toLowerCase()] = isNaN(val) ? 0 : val;
  }

  totalExactAllocated(): number {
    const participants = this.effectiveParticipants();
    if (participants.length === 0) return 0;
    let sum = 0;
    for (const p of participants) {
      sum += this.getExactAmount(p.userEmail);
    }
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  }

  exactDifference(): number {
    const total = this.amount || 0;
    return Math.round((total - this.totalExactAllocated() + Number.EPSILON) * 100) / 100;
  }

  onSplitTypeChange() {
    this.isExactManualEdited = false;
    this.exactAmounts = {};
  }

  effectiveParticipants = computed(() =>
    this.activeEligibleMembers().filter(
      (m) => !this.excludedEmails().has(m.userEmail.toLowerCase()),
    ),
  );

  perPersonShare = computed(() => {
    const count = this.effectiveParticipants().length;
    if (!this.amount || count === 0) return 0;
    return Math.round(((this.amount / count) + Number.EPSILON) * 100) / 100;
  });

  // Group Form Controls (dynamically customized by Admin, with basic auto-defaults)
  controls = computed(() => {
    return this.api.activeGroup()?.formControls || DEFAULT_GROUP_FORM_CONTROLS;
  });

  availableSubcategories(): string[] {
    return CATEGORY_TAXONOMY[this.category] || ['Other'];
  }

  constructor(
    public api: ApiService,
    private aiCategoryService: AiCategoryService,
  ) {}

  ngOnInit() {
    this.payerEmail = this.currentUserEmail();
    this.loadEligibleMembers(this.date);
  }

  onDateChange(newDate: string) {
    this.date = newDate;
    if (newDate) {
      this.loadEligibleMembers(newDate);
    }
  }

  loadEligibleMembers(dateStr: string) {
    const group = this.api.activeGroup();
    if (!group) return;

    this.loadingEligibility.set(true);
    this.api.getEligibleMembers(group.id, dateStr).subscribe({
      next: (res) => {
        const members = res.eligibleMembers || [];
        this.eligibleMembers.set(members);
        this.loadingEligibility.set(false);

        // Ensure selected payer is still valid for this date
        const active = members.filter(
          (m) => m.eligibilityStatus === 'ACTIVE' || m.eligibilityStatus === 'PENDING_INVITE',
        );
        const myEmail = this.currentUserEmail().toLowerCase();
        const currentPayerValid = active.some(
          (m) => m.userEmail.toLowerCase() === (this.payerEmail || myEmail).toLowerCase(),
        );
        if (!currentPayerValid) {
          // If previous selection isn't active on this date, default back to ME if active, or first active member
          const amIActive = active.some((m) => m.userEmail.toLowerCase() === myEmail);
          if (amIActive) {
            this.payerEmail = this.currentUserEmail();
          } else if (active.length > 0) {
            this.payerEmail = active[0].userEmail;
          }
        }
      },
      error: () => {
        this.loadingEligibility.set(false);
      },
    });
  }

  isExcluded(email: string): boolean {
    return this.excludedEmails().has(email.toLowerCase());
  }

  toggleExclude(email: string) {
    const normalized = email.toLowerCase();
    const next = new Set(this.excludedEmails());
    if (next.has(normalized)) {
      next.delete(normalized);
    } else {
      next.add(normalized);
    }
    this.excludedEmails.set(next);
  }

  titleTouched = signal<boolean>(false);

  onCategoryChange(newCat: ExpenseCategory) {
    const subs = CATEGORY_TAXONOMY[newCat] || [];
    if (subs.length > 0 && !subs.includes(this.subCategory)) {
      this.subCategory = subs[0];
    }
  }

  onTitleChange(newTitle: string) {
    if (!newTitle || !newTitle.trim()) {
      this.aiSuggestion.set(null);
      return;
    }

    const prediction = this.aiCategoryService.predict(newTitle);
    if (prediction && prediction.matchedKeyword) {
      this.aiSuggestion.set(prediction);
      this.category = prediction.category;
      if (prediction.subCategory) {
        this.subCategory = prediction.subCategory;
      }
    } else {
      this.aiSuggestion.set(null);
    }
  }

  submit() {
    this.titleTouched.set(true);
    const trimmedTitle = (this.title || '').trim();
    if (!trimmedTitle) {
      this.errorMessage.set('Expense title cannot be empty or just spaces.');
      return;
    }

    if (!this.amount || this.amount <= 0) {
      this.errorMessage.set('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!this.date) {
      this.errorMessage.set('Please select a valid date.');
      return;
    }

    if (this.controls().subCategory === 'mandatory' && !this.subCategory) {
      this.errorMessage.set('Subcategory is mandatory for this group.');
      return;
    }

    if (this.controls().notes === 'mandatory' && (!this.notes || !this.notes.trim())) {
      this.errorMessage.set('Notes / Memo is mandatory for this group.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const effectiveSplit = this.controls().splitType === 'view_only' ? 'EQUAL' : this.splitType;

    const isExpense =
      this.category !== 'Transfers & Adjustments' && this.category !== 'Transfers & Settlements';

    let customSplits: Record<string, number> | undefined = undefined;
    const participants = this.effectiveParticipants();

    if (effectiveSplit === 'PERSONAL') {
      const payer = this.payerEmail || this.currentUserEmail();
      const minorTotal = Math.round((this.amount || 0) * 100);
      customSplits = { [payer]: minorTotal };
      for (const p of this.eligibleMembers()) {
        if (p.userEmail.toLowerCase() !== payer.toLowerCase()) {
          customSplits[p.userEmail] = 0;
        }
      }
    } else if (effectiveSplit === 'EXACT') {
      if (this.amount && participants.length > 0) {
        customSplits = {};
        for (const p of participants) {
          const val = this.getExactAmount(p.userEmail);
          customSplits[p.userEmail] = Math.round(val * 100);
        }
      }
    } else if (this.excludedEmails().size > 0 && participants.length > 0 && this.amount) {
      const minorTotal = Math.round(this.amount * 100);
      const share = Math.floor(minorTotal / participants.length);
      let remainder = minorTotal - share * participants.length;
      customSplits = {};
      for (const p of participants) {
        customSplits[p.userEmail] = share + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
      }
    }

    this.api
      .addExpense({
        title: trimmedTitle,
        amount: this.amount,
        payerEmail: this.payerEmail || undefined,
        date: this.date,
        category: this.category,
        subCategory: this.controls().subCategory !== 'hidden' ? this.subCategory : undefined,
        notes: this.controls().notes !== 'hidden' ? this.notes : undefined,
        isExpense,
        splitType: effectiveSplit,
        splits: customSplits,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 409 && err.error?.status === 'DUPLICATE_DETECTED') {
            this.conflictData.set(err.error);
          } else {
            this.errorMessage.set(err.error?.error || 'Failed to add expense.');
          }
        },
      });
  }

  submitWithOverwrite() {
    const conflict = this.conflictData();
    if (!conflict) return;

    this.loading.set(true);
    const effectiveSplit = this.controls().splitType === 'view_only' ? 'EQUAL' : this.splitType;

    let customSplits: Record<string, number> | undefined = undefined;
    const participants = this.effectiveParticipants();

    if (effectiveSplit === 'PERSONAL') {
      const payer = this.payerEmail || this.currentUserEmail();
      const minorTotal = Math.round((this.amount || 0) * 100);
      customSplits = { [payer]: minorTotal };
      for (const p of this.eligibleMembers()) {
        if (p.userEmail.toLowerCase() !== payer.toLowerCase()) {
          customSplits[p.userEmail] = 0;
        }
      }
    } else if (effectiveSplit === 'EXACT') {
      if (this.amount && participants.length > 0) {
        customSplits = {};
        for (const p of participants) {
          const val = this.getExactAmount(p.userEmail);
          customSplits[p.userEmail] = Math.round(val * 100);
        }
      }
    } else if (this.excludedEmails().size > 0 && participants.length > 0 && this.amount) {
      const minorTotal = Math.round(this.amount * 100);
      const share = Math.floor(minorTotal / participants.length);
      let remainder = minorTotal - share * participants.length;
      customSplits = {};
      for (const p of participants) {
        customSplits[p.userEmail] = share + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
      }
    }

    this.api
      .addExpense({
        title: this.title,
        amount: this.amount!,
        payerEmail: this.payerEmail || undefined,
        date: this.date,
        category: this.category,
        subCategory: this.controls().subCategory !== 'hidden' ? this.subCategory : undefined,
        notes: this.controls().notes !== 'hidden' ? this.notes : undefined,
        splitType: effectiveSplit,
        splits: customSplits,
        allowOverwrite: true,
        overwriteTargetId: conflict.existingRecord.id,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.close.emit();
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.error || 'Failed to overwrite expense.');
        },
      });
  }
}
