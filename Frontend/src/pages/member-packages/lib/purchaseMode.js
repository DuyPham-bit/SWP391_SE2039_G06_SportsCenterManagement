// Pricing-page rule: a member holds at most one running package.
// new      -> no active package
// renew    -> same package (backend stacks a new cycle and keeps the chosen sports)
// upgrade  -> higher (or same-tier other) package; old one is retired on payment
// downgrade-> lower tier while a higher package is still active: blocked
export function getPurchaseMode(pkg, current) {
  if (!current?.hasActivePackage) return 'new';
  if (pkg.id === current.packageId) return 'renew';
  const tier = Number(pkg.tierLevel || 0);
  const currentTier = Number(current.tierLevel || 0);
  return tier < currentTier ? 'downgrade' : 'upgrade';
}

/** Sport picking is required on new/upgrade purchases of a non all-access package. */
export function needsSportPicker(pkg, mode) {
  return (mode === 'new' || mode === 'upgrade') && !pkg.isAllAccess && Number(pkg.allowedSports || 0) > 0;
}

export function purchaseLabel(mode, isEn) {
  switch (mode) {
    case 'renew': return isEn ? 'Renew Another Cycle' : 'Gia Hạn Thêm Chu Kỳ';
    case 'upgrade': return isEn ? 'Upgrade Package' : 'Nâng Cấp Gói';
    case 'downgrade': return isEn ? 'Unavailable while a higher package is active' : 'Không thể hạ cấp khi gói cao hơn còn hạn';
    default: return isEn ? 'Subscribe Now' : 'Đăng Ký Gói Này';
  }
}
