export async function generateStatement(params, db) {
    const { flatId, startDate, endDate } = params;
    const flat = await db.getGroupById(flatId);
    const flatName = flat?.name || 'My Group';
    const allExpenses = await db.getExpenses(flatId);
    const allSettlements = await db.getSettlements(flatId);
    const members = await db.getMembers(flatId);
    // Filter expenses and settlements within date range
    const periodExpenses = allExpenses.filter((e) => {
        const d = e.createdAt.split('T')[0];
        return d >= startDate && d <= endDate;
    });
    const periodSettlements = allSettlements.filter((s) => {
        const d = s.settledAt.split('T')[0];
        return d >= startDate && d <= endDate;
    });
    let totalSpendMinorUnits = 0;
    const categoryMap = {};
    const subcategoryMap = {};
    const paidMap = {};
    const shareMap = {};
    members.forEach((m) => {
        paidMap[m.userEmail] = 0;
        shareMap[m.userEmail] = 0;
    });
    for (const exp of periodExpenses) {
        // CRITICAL: Transfers & Adjustments (isExpense: false) are P2P transfers/repayments, excluded from expense charts
        if (exp.isExpense === false ||
            exp.category === 'Transfers & Adjustments' ||
            exp.category === 'Transfers & Settlements') {
            continue;
        }
        totalSpendMinorUnits += exp.totalAmountMinorUnits;
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.totalAmountMinorUnits;
        const sub = exp.subCategory || 'General';
        if (!subcategoryMap[exp.category]) {
            subcategoryMap[exp.category] = {};
        }
        subcategoryMap[exp.category][sub] =
            (subcategoryMap[exp.category][sub] || 0) + exp.totalAmountMinorUnits;
        paidMap[exp.payerEmail] = (paidMap[exp.payerEmail] || 0) + exp.totalAmountMinorUnits;
        for (const [email, owedMinor] of Object.entries(exp.splits)) {
            shareMap[email] = (shareMap[email] || 0) + Number(owedMinor);
        }
    }
    const categoryBreakdown = Object.entries(categoryMap).map(([category, amountMinor]) => {
        const subEntries = Object.entries(subcategoryMap[category] || {});
        const subcategories = subEntries.map(([subCat, subMinor]) => ({
            subCategory: subCat,
            amountDisplay: Math.round((subMinor / 100) * 100) / 100,
            percentage: amountMinor > 0 ? Math.round((subMinor / amountMinor) * 1000) / 10 : 0,
        }));
        return {
            category,
            amountDisplay: Math.round((amountMinor / 100) * 100) / 100,
            percentage: totalSpendMinorUnits > 0
                ? Math.round((amountMinor / totalSpendMinorUnits) * 1000) / 10
                : 0,
            subcategories,
        };
    });
    const memberSummaries = members.map((m) => {
        const totalPaid = (paidMap[m.userEmail] || 0) / 100;
        const totalShare = (shareMap[m.userEmail] || 0) / 100;
        const netBalance = Math.round((totalPaid - totalShare) * 100) / 100;
        return {
            userEmail: m.userEmail,
            userName: m.name,
            totalPaidDisplay: Math.round(totalPaid * 100) / 100,
            totalShareDisplay: Math.round(totalShare * 100) / 100,
            netBalanceDisplay: netBalance,
        };
    });
    const label = params.monthLabel || `${startDate} to ${endDate}`;
    return {
        groupId: flatId,
        groupName: flatName,
        flatId,
        flatName,
        periodLabel: label,
        startDate,
        endDate,
        totalSpendDisplay: Math.round((totalSpendMinorUnits / 100) * 100) / 100,
        categoryBreakdown,
        memberSummaries,
        expensesCount: periodExpenses.length,
        settlementsCount: periodSettlements.length,
        createdAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=statementService.js.map