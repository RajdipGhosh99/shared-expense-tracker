import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service.js';
import { AddExpenseModalComponent } from '../expenses/add-expense-modal.component.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, AddExpenseModalComponent],
  template: `
    <!-- Mobile App Container (Edge-to-edge on mobile, sleek frame on desktop) -->
    <div class="min-h-screen max-w-md mx-auto bg-slate-100/70 flex flex-col shadow-2xl relative">
      
      <!-- Top Mobile App Header -->
      <header class="bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 pt-safe shadow-xs">
        <div class="flex items-center justify-between">
          
          <!-- Group Brand & Invite Code Chip -->
          <div class="flex items-center space-x-2.5">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-500/25 text-lg">
              👥
            </div>
            <div>
              <h1 class="text-sm font-black leading-tight text-slate-900 truncate max-w-[170px]">
                {{ api.activeGroup()?.name || 'My Group' }}
              </h1>
              <div class="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                <span class="font-medium">Code:</span>
                <span class="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded-md">
                  {{ api.activeGroup()?.inviteCode }}
                </span>
                <button
                  (click)="copyCode()"
                  class="text-slate-400 hover:text-indigo-600 active:scale-90 transition-transform cursor-pointer"
                  [title]="copiedCode() ? 'Copied!' : 'Copy Code'"
                >
                  {{ copiedCode() ? '✅' : '📋' }}
                </button>
              </div>
            </div>
          </div>

          <!-- User Pill & Log Out -->
          <div class="flex items-center space-x-2">
            <div class="text-right">
              <p class="text-xs font-bold text-slate-900 leading-none truncate max-w-[85px] sm:max-w-none">{{ api.currentUser()?.name }}</p>
              <button (click)="api.logout(); router.navigate(['/auth'])" class="text-[10px] text-slate-400 font-semibold hover:text-rose-500 cursor-pointer">
                Log out
              </button>
            </div>
            <div class="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm flex-shrink-0">
              {{ api.currentUser()?.name?.charAt(0) || 'U' }}
            </div>
          </div>

        </div>
      </header>

      <!-- Scrollable Mobile Body -->
      <main class="flex-1 p-4 space-y-4 pb-24 overflow-y-auto">

        <!-- Automated Month-End Alert Banner -->
        <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between">
          <div class="space-y-0.5">
            <p class="text-[10px] font-black uppercase tracking-wider text-amber-100 flex items-center space-x-1">
              <span>📅</span>
              <span>Month-End Settlement</span>
            </p>
            <p class="text-xs font-bold">Ledger finalized. Settle up or export PDF!</p>
          </div>
          <button (click)="router.navigate(['/statements'])" class="px-3.5 py-1.5 bg-white text-orange-600 hover:bg-amber-50 rounded-xl font-extrabold text-xs shadow-xs active:scale-95 transition-transform cursor-pointer">
            View ↗
          </button>
        </div>

        <!-- HERO NET STANDING CARD -->
        <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-xl border border-slate-800/80 relative overflow-hidden space-y-4">
          <!-- Subtle Accent Ring Glow -->
          <div class="absolute -right-8 -top-8 w-36 h-36 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>

          <div class="flex justify-between items-center text-xs relative z-10">
            <span class="text-slate-400 uppercase tracking-widest font-extrabold text-[10px]">Your Net Standing</span>
            <span
              class="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide border shadow-xs"
              [class.bg-emerald-500/20]="myNetBalance() >= 0"
              [class.text-emerald-300]="myNetBalance() >= 0"
              [class.border-emerald-500/30]="myNetBalance() >= 0"
              [class.bg-rose-500/20]="myNetBalance() < 0"
              [class.text-rose-300]="myNetBalance() < 0"
              [class.border-rose-500/30]="myNetBalance() < 0"
            >
              {{ myNetBalance() >= 0 ? '🟢 You get back' : '🔴 You owe' }}
            </span>
          </div>

          <div class="flex items-baseline space-x-1.5 relative z-10">
            <span
              class="text-4xl font-black tracking-tight"
              [class.text-emerald-400]="myNetBalance() >= 0"
              [class.text-rose-400]="myNetBalance() < 0"
            >
              {{ myNetBalance() >= 0 ? '+' : '-' }}₹{{ absNetBalance() }}
            </span>
          </div>

          <!-- Vacation Mode Toggle Bar -->
          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs relative z-10">
            <div class="flex items-center space-x-2 text-slate-300">
              <span class="text-base">🌴</span>
              <span class="font-medium text-xs">Vacation Mode</span>
            </div>
            <button
              (click)="toggleVacation()"
              class="px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
              [class.bg-emerald-500]="isAway()"
              [class.text-white]="isAway()"
              [class.bg-slate-800]="!isAway()"
              [class.text-slate-300]="!isAway()"
              [class.border]="!isAway()"
              [class.border-slate-700]="!isAway()"
            >
              {{ isAway() ? 'Away (Excluded)' : 'At Group (Active)' }}
            </button>
          </div>
        </div>

        <!-- QUICK ACTIONS BAR -->
        <div class="grid grid-cols-4 gap-2">
          <!-- Action: Scan Bill -->
          <button
            (click)="router.navigate(['/screenshot-review'])"
            class="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span class="text-xl">📷</span>
            <span class="text-[10px] font-bold text-slate-700">Scan Bill</span>
          </button>

          <!-- Action: Add Expense -->
          <button
            (click)="showAddModal.set(true)"
            class="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span class="text-xl">➕</span>
            <span class="text-[10px] font-bold text-slate-700">Add Bill</span>
          </button>

          <!-- Action: Statements -->
          <button
            (click)="router.navigate(['/statements'])"
            class="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span class="text-xl">📊</span>
            <span class="text-[10px] font-bold text-slate-700">Reports</span>
          </button>

          <!-- Action: Share WhatsApp -->
          <button
            (click)="shareInvite()"
            class="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <span class="text-xl">💬</span>
            <span class="text-[10px] font-bold text-slate-700">Invite</span>
          </button>
        </div>

        <!-- SUGGESTED SETTLEMENTS (Min-Cash-Flow) -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <span>⚡</span>
              <span>Suggested Settlements</span>
            </h3>
            <span class="text-[10px] text-slate-400 font-semibold">Min-Cash-Flow</span>
          </div>

          <div *ngIf="simplifiedDebts().length === 0" class="py-6 text-center text-xs text-slate-400 font-medium space-y-1">
            <p class="text-2xl">🎉</p>
            <p>Everyone is settled up! Zero outstanding debts.</p>
          </div>

          <div *ngFor="let tx of simplifiedDebts()" class="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between transition-all">
            <div class="space-y-1">
              <p class="text-xs font-bold text-slate-800">
                <span class="text-slate-900 font-black">{{ tx.fromUserEmail.split('@')[0] }}</span>
                <span class="text-slate-400 font-normal mx-1">owes</span>
                <span class="text-indigo-600 font-black">{{ tx.receiverName || tx.toUserEmail.split('@')[0] }}</span>
              </p>
              <p class="text-lg font-black text-slate-900">₹{{ tx.amountDisplay }}</p>
            </div>

            <!-- Instant UPI Deep Link Button -->
            <div class="flex items-center space-x-2">
              <a
                *ngIf="tx.upiLink"
                [href]="tx.upiLink"
                class="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 active:scale-95 transition-all text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center space-x-1 cursor-pointer"
              >
                <span>⚡ Pay UPI</span>
              </a>
              <button
                (click)="markSettled(tx)"
                class="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 transition-all text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Settled
              </button>
            </div>
          </div>
        </div>

        <!-- RECENT GROUP EXPENSES FEED -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <span>🧾</span>
              <span>Recent Bills</span>
            </h3>
            <span class="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {{ api.expenses().length }} entries
            </span>
          </div>

          <div *ngIf="api.expenses().length === 0" class="py-8 text-center text-xs text-slate-400 space-y-1">
            <p class="text-2xl">📋</p>
            <p>No bills logged yet. Tap ➕ Add Bill or Scan Bill above!</p>
          </div>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let exp of api.expenses()" class="py-3 flex items-center justify-between">
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="text-sm">{{ getCategoryIcon(exp.category) }}</span>
                  <p class="font-bold text-slate-900 text-xs">{{ exp.title }}</p>
                  <!-- Overwritten Flag Badge -->
                  <span *ngIf="exp.overwrittenFlag === 'YES'" class="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono text-[9px] font-bold rounded">
                    🔄 Overwritten
                  </span>
                </div>
                <p class="text-[11px] text-slate-400">
                  Paid by <span class="font-bold text-slate-700">{{ exp.payerEmail.split('@')[0] }}</span> • {{ exp.category }}
                </p>
              </div>

              <div class="text-right space-y-0.5">
                <p class="font-black text-slate-900 text-sm">₹{{ exp.totalAmountDisplay }}</p>
                <button (click)="deleteExpense(exp.id)" class="text-slate-400 hover:text-rose-500 text-[10px] font-bold active:scale-90 cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      <!-- Fixed Mobile Bottom Navigation Bar (Thumb Friendly) -->
      <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-4 py-2 flex items-center justify-around z-40 shadow-lg">
        
        <!-- Home Tab -->
        <button (click)="router.navigate(['/dashboard'])" class="flex flex-col items-center justify-center text-indigo-600 active:scale-90 transition-transform cursor-pointer">
          <span class="text-lg">🏠</span>
          <span class="text-[10px] font-extrabold">Home</span>
        </button>

        <!-- Scan Receipt Tab -->
        <button (click)="router.navigate(['/screenshot-review'])" class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-transform cursor-pointer">
          <span class="text-lg">📷</span>
          <span class="text-[10px] font-bold">Scan Bill</span>
        </button>

        <!-- Center Prominent ADD EXPENSE Floating Button -->
        <button
          (click)="showAddModal.set(true)"
          class="-mt-6 w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-600/40 border-4 border-slate-100 active:scale-95 transition-transform cursor-pointer"
        >
          ＋
        </button>

        <!-- Statements Tab -->
        <button (click)="router.navigate(['/statements'])" class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-transform cursor-pointer">
          <span class="text-lg">📊</span>
          <span class="text-[10px] font-bold">Reports</span>
        </button>

        <!-- WhatsApp Group Share Tab -->
        <button (click)="shareInvite()" class="flex flex-col items-center justify-center text-emerald-600 hover:text-emerald-700 active:scale-90 transition-transform cursor-pointer">
          <span class="text-lg">💬</span>
          <span class="text-[10px] font-bold">Invite</span>
        </button>

      </nav>

      <!-- Add Expense Mobile Bottom Sheet -->
      <app-add-expense-modal *ngIf="showAddModal()" (close)="showAddModal.set(false)"></app-add-expense-modal>

    </div>
  `
})
export class DashboardComponent {
  showAddModal = signal<boolean>(false);
  copiedCode = signal<boolean>(false);

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
    const member = this.api.members().find(m => m.userEmail === user?.email);
    return member?.isAway || false;
  });

  constructor(public api: ApiService, public router: Router) {}

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
    if (cat.includes('grocer') || cat.includes('blinkit') || cat.includes('zepto') || cat.includes('instamart')) return '🛒';
    if (cat.includes('food') || cat.includes('zomato') || cat.includes('swiggy') || cat.includes('dining')) return '🍕';
    if (cat.includes('util') || cat.includes('wifi') || cat.includes('electric') || cat.includes('gas')) return '⚡';
    if (cat.includes('rent') || cat.includes('maid') || cat.includes('cook')) return '🏠';
    if (cat.includes('travel') || cat.includes('uber') || cat.includes('ola')) return '🚗';
    return '🧾';
  }
}
