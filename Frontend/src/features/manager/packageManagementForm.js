export const MAX_PACKAGE_PRICE = 9_999_999_999;

export function sortMembershipPackages(packages) {
  return packages
    .map((pkg, originalIndex) => ({ pkg, originalIndex }))
    .sort((left, right) => {
      const leftInactive = String(left.pkg?.status || '').toUpperCase() === 'INACTIVE';
      const rightInactive = String(right.pkg?.status || '').toUpperCase() === 'INACTIVE';
      return Number(leftInactive) - Number(rightInactive)
        || left.originalIndex - right.originalIndex;
    })
    .map(({ pkg }) => pkg);
}

export function validatePackagePrice(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return { valid: false, message: 'Vui lòng nhập giá gói tập.' };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { valid: false, message: 'Giá gói tập phải là một số hợp lệ.' };
  }
  if (parsed <= 0) {
    return { valid: false, message: 'Học phí / Giá gói tập phải lớn hơn 0 VNĐ.' };
  }
  if (parsed > MAX_PACKAGE_PRICE) {
    return {
      valid: false,
      message: `Giá gói tập không được vượt quá ${MAX_PACKAGE_PRICE.toLocaleString('vi-VN')} VNĐ.`
    };
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(value).trim())) {
    return { valid: false, message: 'Giá gói tập chỉ được có tối đa 2 chữ số thập phân.' };
  }

  return { valid: true, value: parsed };
}
