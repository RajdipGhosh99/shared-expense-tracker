/**
 * Formats minor units (paise) into INR currency display (e.g. ₹1,450.50).
 */
export function formatINR(minorUnits) {
    const isNegative = minorUnits < 0;
    const absUnits = Math.abs(minorUnits);
    const amount = (absUnits / 100).toFixed(2);
    const formatted = Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${isNegative ? '-' : ''}₹${formatted}`;
}
/**
 * Generates UPI Deep Link for instant 1-tap settlement via GPay / PhonePe / Paytm / BHIM.
 */
export function generateUPIDeepLink(params) {
    const amount = (params.amountMinorUnits / 100).toFixed(2);
    const query = new URLSearchParams({
        pa: params.receiverUPI,
        pn: params.receiverName,
        am: amount,
        cu: 'INR',
        tn: params.note || 'Group Settlement',
    });
    return `upi://pay?${query.toString()}`;
}
/**
 * Generates a clean, emoji-formatted WhatsApp digest message for the group.
 */
export function formatWhatsAppMonthlyDigest(statement, appUrl) {
    const groupTitle = statement.groupName || statement.flatName || 'Group';
    const lines = [];
    lines.push(`📊 *${groupTitle} — Monthly Statement*`);
    lines.push(`📅 *Period:* ${statement.periodLabel}`);
    lines.push(`💰 *Total Group Spend:* ₹${statement.totalSpendDisplay.toLocaleString('en-IN')}`);
    lines.push('');
    lines.push(`🏷️ *Top Expense Categories:*`);
    statement.categoryBreakdown.slice(0, 4).forEach((c) => {
        lines.push(`  • ${c.category}: ₹${c.amountDisplay.toLocaleString('en-IN')} (${c.percentage}%)`);
    });
    lines.push('');
    lines.push(`👥 *Group Member Net Balances:*`);
    statement.memberSummaries.forEach((m) => {
        const sign = m.netBalanceDisplay >= 0 ? '+₹' : '-₹';
        const absVal = Math.abs(m.netBalanceDisplay).toLocaleString('en-IN');
        const action = m.netBalanceDisplay >= 0 ? '(Gets back)' : '(Owes)';
        lines.push(`  • *${m.userName}:* ${sign}${absVal} ${action}`);
    });
    if (appUrl) {
        lines.push('');
        lines.push(`👉 View full breakdown & settle: ${appUrl}`);
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(lines.join('\n'))}`;
}
//# sourceMappingURL=formatters.js.map