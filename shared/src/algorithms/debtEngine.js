"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyDebts = simplifyDebts;
/**
 * Greedy Min-Cash-Flow Algorithm for Flatmate Debt Simplification.
 * Minimizes the number of peer-to-peer transfers from O(N^2) to at most N - 1.
 */
function simplifyDebts(flatId, members, expenses, settlements) {
    const netBalances = {};
    // 1. Initialize all member balances to 0 paise
    members.forEach((m) => (netBalances[m.email] = 0));
    // 2. Accumulate Expenses
    for (const exp of expenses) {
        for (const [consumerEmail, owedMinorUnits] of Object.entries(exp.splits)) {
            if (consumerEmail === exp.payerEmail)
                continue;
            // Payer is credited (+owed)
            netBalances[exp.payerEmail] =
                (netBalances[exp.payerEmail] || 0) + owedMinorUnits;
            // Consumer is debited (-owed)
            netBalances[consumerEmail] =
                (netBalances[consumerEmail] || 0) - owedMinorUnits;
        }
    }
    // 3. Accumulate Past Settlements
    for (const set of settlements) {
        // Payer sent money -> their debt decreases (+amount)
        netBalances[set.payerEmail] =
            (netBalances[set.payerEmail] || 0) + set.amountMinorUnits;
        // Receiver received money -> their credit decreases (-amount)
        netBalances[set.receiverEmail] =
            (netBalances[set.receiverEmail] || 0) - set.amountMinorUnits;
    }
    // 4. Group into Debtors (negative balance) and Creditors (positive balance)
    const debtors = [];
    const creditors = [];
    for (const [email, balance] of Object.entries(netBalances)) {
        if (balance < 0) {
            debtors.push({ email, amount: -balance });
        }
        else if (balance > 0) {
            creditors.push({ email, amount: balance });
        }
    }
    // Sort descending by amount to minimize total transaction count
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const simplifiedDebts = [];
    const memberMap = new Map(members.map((m) => [m.email, m]));
    let dIdx = 0;
    let cIdx = 0;
    while (dIdx < debtors.length && cIdx < creditors.length) {
        const debtor = debtors[dIdx];
        const creditor = creditors[cIdx];
        const settledAmount = Math.min(debtor.amount, creditor.amount);
        if (settledAmount > 0) {
            const creditorInfo = memberMap.get(creditor.email);
            simplifiedDebts.push({
                fromUserEmail: debtor.email,
                toUserEmail: creditor.email,
                amountMinorUnits: settledAmount,
                amountDisplay: Math.round((settledAmount / 100) * 100) / 100,
                receiverUPI: creditorInfo?.upiId,
                receiverName: creditorInfo?.name || creditor.email,
            });
            debtor.amount -= settledAmount;
            creditor.amount -= settledAmount;
        }
        if (debtor.amount === 0)
            dIdx++;
        if (creditor.amount === 0)
            cIdx++;
    }
    return {
        flatId,
        netBalances,
        simplifiedDebts,
    };
}
//# sourceMappingURL=debtEngine.js.map