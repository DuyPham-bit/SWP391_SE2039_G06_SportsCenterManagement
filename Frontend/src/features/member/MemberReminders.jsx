export function MemberReminders({ items }) {
  if (!items.length) return null;
  return (
    <section aria-label="Nhắc lịch và hạn gói" className="space-y-3">
      <h2 className="font-chivo font-bold text-sm text-slate-900">Nhắc lịch & Thời hạn gói tập</h2>
      {items.map(item => (
        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3 min-w-0">
            <span aria-hidden="true" className="material-symbols-outlined text-amber-700">{item.icon}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 break-words">{item.title}</p>
              <p className="text-xs text-slate-600 mt-1 break-words">{item.content}</p>
            </div>
          </div>
          <a href={item.href} className="text-xs font-bold text-red-700 hover:underline shrink-0">{item.action}</a>
        </div>
      ))}
    </section>
  );
}
