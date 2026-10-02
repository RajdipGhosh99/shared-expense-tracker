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
    <div class="min-h-screen max-w-md mx-auto bg-slate-50 flex flex-col shadow-2xl relative">
      
      <!-- Top Mobile App Header -->
      <header class="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 pt-safe">
        <div class="flex items-center justify-between">
          
          <!-- Flat Brand & Invite Code Chip -->
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30 text-base">
              🏠
            </div>
            <div>
              <h1 class="text-sm font-black leading-tight text-slate-900 truncate max-w-[170px]">{{ api.activeFlat()?.name || 'My Flat' }}</h1>
              <div class="flex items-center space-x-1 text-[11px] text-slate-500">
                <span>Code:</span>
                <span class="font-mono font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">{{ api.activeFlat()?.inviteCode }}</span>
                <button (click)="copyCode()" class="text-slate-400 hover:text-indigo-600 active:scale-90 transition-transform">📋</button>
              </div>
            </div>
          </div>

          <!-- User Pill / Log Out -->
          <div class="flex items-center space-x-1.5">
            <div class="text-right">
              <p class="text-xs font-bold text-slate-900 leading-none">{{ api.currentUser()?.name }}</p>
              <button (click)="api.logout(); router.navigate(['/auth'])" class="text-[10px] text-slate-400 font-semibold hover:text-rose-500">Log out</button>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
              {{ api.currentUser()?.name?.charAt(0) || 'U' }}
            </div>
          </div>

        </div>
      </header>

      <!-- Scrollable Mobile Body -->
      <main class="flex-1 p-4 space-y-4 pb-safe overflow-y-auto">

        <!-- Automated Month-End Ready Card -->
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between">
          <div class="space-y-0.5">
            <p class="text-[10px] font-bold uppercase tracking-wider text-amber-100">Month-End Statement</p>
            <p class="text-xs font-bold">Ledger finalized. Settle up now!</p>
          </div>
          <button (click)="router.navigate(['/statements'])" class="px-3 py-1.5 bg-white text-orange-600 rounded-xl font-black text-xs shadow-xs active:scale-95 transition-transform">
            View ↗
          </button>
        </div>

        <!-- Hero Net Standing Tile -->
        <div class="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-xl relative overflow-hidden space-y-3">
          
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400 uppercase tracking-widest font-bold text-[10px]">Your Net Standing</span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide" [class.bg-emerald-500/20]="myNetBalance() >= 0" [class.text-emerald-300]="myNetBalance() >= 0" [class.bg-rose-500/20]="myNetBalance() < 0" [class.text-rose-300]="myNetBalance() < 0">
              {{ myNetBalance() >= 0 ? '🟢 You get back' : '🔴 You owe' }}
            </span>
          </div>

          <div class="flex items-baseline space-x-1.5">
            <span class="text-3xl font-black tracking-tight" [class.text-emerald-400]="myNetBalance() >= 0" [class.text-rose-400]="myNetBalance() < 0">
              {{ myNetBalance() >= 0 ? '+' : '-' }}₹{{ absNetBalance() }}
            </span>
          </div>

          <!-- Vacation Mode Toggle Bar -->
          <div class="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
            <div class="flex items-center space-x-2 text-slate-300">
              <span>🌴</span>
              <span class="font-medium text-[11px]">Vacation Mode</span>
            </div>
            <button (click)="toggleVacation()" class="px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all active:scale-95" [class.bg-emerald-500]="isAway()" [class.text-white]="isAway()" [class.bg-slate-700]="!isAway()" [class.text-slate-300]="!isAway()">
              {{ isAway() ? 'Away (Excluded)' : 'At Flat (Active)' }}
            </button>
          </div>
        </div>

        <!-- Suggested Settlements (Min-Cash-Flow) -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-2.5">
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-slate-900 text-xs">Suggested Settlements</h3>
            <span class="text-[10px] text-slate-400 font-medium">Min transfers</span>
          </div>

          <div *ngIf="simplifiedDebts().length === 0" class="py-3 text-center text-xs text-slate-400 font-medium">
            🎉 Everyone is settled up! Zero debts.
          </div>

          <div *ngFor="let tx of simplifiedDebts()" class="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div class="space-y-0.5">
              <p class="text-xs font-bold text-slate-800">
                <span class="text-slate-900">{{ tx.fromUserEmail.split('@')[0] }}</span> owes 
                <span class="text-indigo-600">{{ tx.receiverName || tx.toUserEmail.split('@')[0] }}</span>
              </p>
              <p class="text-base font-black text-slate-900">₹{{ tx.amountDisplay }}</p>
            </div>

            <!-- Instant UPI Deep Link Button -->
            <div class="flex items-center space-x-1.5">
              <a *ngIf="tx.upiLink" [href]="tx.upiLink" class="px-3 py-1.5 bg-emerald-600 active:scale-95 transition-transform text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center space-x-1">
                <span>⚡ Pay UPI</span>
              </a>
              <button (click)="markSettled(tx)" class="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 transition-transform text-slate-700 rounded-xl text-xs font-bold">
                Settled
              </button>
            </div>
          </div>
        </div>

        <!-- Recent Flat Expenses Feed -->
        <div class="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div class="flex justify-between items-center">
            <h3 class="font-bold text-slate-900 text-xs">Recent Expenses</h3>
            <span class="text-[10px] text-slate-400">{{ api.expenses().length }} bills</span>
          </div>

          <div *ngIf="api.expenses().length === 0" class="py-8 text-center text-xs text-slate-400">
            No bills logged yet. Tap ➕ below or Scan Receipt!
          </div>

          <div class="divide-y divide-slate-100">
            <div *ngFor="let exp of api.expenses()" class="py-2.5 flex items-center justify-between">
              <div class="space-y-0.5">
                <div class="flex items-center space-x-1.5">
                  <p class="font-bold text-slate-900 text-xs">{{ exp.title }}</p>
                  <!-- Overwritten Badge -->
                  <span *ngIf="exp.overwrittenFlag === 'YES'" class="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-mono text-[9px] font-bold rounded">
                    🔄 Overwritten
                  </span>
                </div>
                <p class="text-[11px] text-slate-400">
                  By <span class="font-medium text-slate-600">{{ exp.payerEmail.split('@')[0] }}</span> • 
                  {{ exp.category }}
                </p>
              </div>

              <div class="text-right">
                <p class="font-black text-slate-900 text-sm">₹{{ exp.totalAmountDisplay }}</p>
                <button (click)="deleteExpense(exp.id)" class="text-slate-300 hover:text-rose-500 text-[10px] active:scale-90">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      <!-- Fixed Mobile Bottom Navigation Bar (Thumb Friendly) -->
      <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-4 py-2 flex items-center justify-around z-40 shadow-lg">
        
        <!-- Home / Dashboard Tab -->
        <button (click)="router.navigate(['/dashboard'])" class="flex flex-col items-center justify-center text-indigo-600 active:scale-90 transition-transform">
          <span class="text-lg">🏠</span>
          <span class="text-[10px] font-bold">Home</span>
        </button>

        <!-- Scan / Paste Receipt Tab -->
        <button (click)="router.navigate(['/screenshot-review'])" class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-transform">
          <span class="text-lg">📷</span>
          <span class="text-[10px] font-bold">Scan Bill</span>
        </button>

        <!-- Center Prominent ADD EXPENSE Floating Button -->
        <button (click)="showAddModal.set(true)" class="-mt-6 w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-600/40 border-4 border-slate-50 active:scale-95 transition-transform">
          ＋
        </button>

        <!-- Statements Tab -->
        <button (click)="router.navigate(['/statements'])" class="flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 active:scale-90 transition-transform">
          <span class="text-lg">📊</span>
          <span class="text-[10px] font-bold">Reports</span>
        </button>

        <!-- WhatsApp Flat Share Tab -->
        <button (click)="shareInvite()" class="flex flex-col items-center justify-center text-emerald-600 hover:text-emerald-700 active:scale-90 transition-transform">
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
    const code = this.api.activeFlat()?.inviteCode;
    if (code) {
      navigator.clipboard.writeText(code);
      alert(`Copied flat invite code: ${code}`);
    }
  }

  shareInvite() {
    const flat = this.api.activeFlat();
    if (!flat) return;
    const msg = `Hey! Join our flat "${flat.name}" on Flatmate Tracker to easily split bills:\nInvite Code: *${flat.inviteCode}*`;
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
}
