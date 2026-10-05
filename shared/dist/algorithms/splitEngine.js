/**
 * Calculates exact split allocations using integer minor units (paise/cents)
 * to guarantee 0.00% floating point drift and exact sum balance.
 */
export function calculateSplits(request) {
    const { totalAmountMinorUnits, splitType, memberEmails, absentMemberEmails = [] } = request;
    if (totalAmountMinorUnits <= 0) {
        return {
            splits: {},
            isValid: false,
            errorMessage: 'Total amount must be greater than zero.',
        };
    }
    // Filter out group members on vacation
    const activeMembers = memberEmails.filter((email) => !absentMemberEmails.includes(email));
    if (activeMembers.length === 0) {
        return {
            splits: {},
            isValid: false,
            errorMessage: 'No active members available to split this expense.',
        };
    }
    const splits = {};
    switch (splitType) {
        case 'EQUAL': {
            const n = activeMembers.length;
            const baseShare = Math.floor(totalAmountMinorUnits / n);
            let remainder = totalAmountMinorUnits - baseShare * n;
            for (const email of activeMembers) {
                let share = baseShare;
                // Distribute 1 extra remainder unit (paisa) to first members until remainder is 0
                if (remainder > 0) {
                    share += 1;
                    remainder -= 1;
                }
                splits[email] = share;
            }
            return { splits, isValid: true };
        }
        case 'EXACT': {
            if (!request.exactAmountsMinorUnits) {
                // Default behavior: calculate exact minor unit splits evenly across active members
                const n = activeMembers.length;
                const baseShare = Math.floor(totalAmountMinorUnits / n);
                let remainder = totalAmountMinorUnits - baseShare * n;
                for (const email of activeMembers) {
                    let share = baseShare;
                    if (remainder > 0) {
                        share += 1;
                        remainder -= 1;
                    }
                    splits[email] = share;
                }
                return { splits, isValid: true };
            }
            let sum = 0;
            for (const email of activeMembers) {
                const val = Math.round(request.exactAmountsMinorUnits[email] || 0);
                splits[email] = val;
                sum += val;
            }
            if (sum !== totalAmountMinorUnits) {
                const diff = (sum - totalAmountMinorUnits) / 100;
                return {
                    splits: {},
                    isValid: false,
                    errorMessage: `Sum of exact splits (₹${(sum / 100).toFixed(2)}) does not match total bill (₹${(totalAmountMinorUnits / 100).toFixed(2)}). Difference: ₹${diff.toFixed(2)}.`,
                };
            }
            return { splits, isValid: true };
        }
        case 'PERSONAL': {
            // 100% of expense is allocated to the payer; all other flatmates owe 0. No debt generated.
            const payer = (request.payerEmail || '').toLowerCase();
            for (const email of activeMembers) {
                splits[email] = email.toLowerCase() === payer ? totalAmountMinorUnits : 0;
            }
            if (request.payerEmail && !activeMembers.some((e) => e.toLowerCase() === payer)) {
                splits[request.payerEmail] = totalAmountMinorUnits;
            }
            return { splits, isValid: true };
        }
        case 'PERCENTAGE': {
            if (!request.percentages) {
                return {
                    splits: {},
                    isValid: false,
                    errorMessage: 'Percentages mapping is required.',
                };
            }
            let totalPct = 0;
            for (const email of activeMembers) {
                totalPct += request.percentages[email] || 0;
            }
            if (Math.abs(totalPct - 100) > 0.05) {
                return {
                    splits: {},
                    isValid: false,
                    errorMessage: `Percentages must add up to 100% (currently ${totalPct.toFixed(2)}%).`,
                };
            }
            let allocatedSum = 0;
            activeMembers.forEach((email, idx) => {
                if (idx === activeMembers.length - 1) {
                    // Last member gets the remaining exact balance to avoid rounding drift
                    splits[email] = totalAmountMinorUnits - allocatedSum;
                }
                else {
                    const pct = request.percentages[email] || 0;
                    const share = Math.round((pct / 100) * totalAmountMinorUnits);
                    splits[email] = share;
                    allocatedSum += share;
                }
            });
            return { splits, isValid: true };
        }
        case 'SHARES': {
            if (!request.shares) {
                return {
                    splits: {},
                    isValid: false,
                    errorMessage: 'Shares mapping is required.',
                };
            }
            let totalShares = 0;
            for (const email of activeMembers) {
                totalShares += request.shares[email] || 1;
            }
            let allocatedSum = 0;
            activeMembers.forEach((email, idx) => {
                if (idx === activeMembers.length - 1) {
                    splits[email] = totalAmountMinorUnits - allocatedSum;
                }
                else {
                    const memberShares = request.shares[email] || 1;
                    const share = Math.round((memberShares / totalShares) * totalAmountMinorUnits);
                    splits[email] = share;
                    allocatedSum += share;
                }
            });
            return { splits, isValid: true };
        }
    }
}
//# sourceMappingURL=splitEngine.js.map