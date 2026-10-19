import React from 'react';
import { PerformanceDashboard } from './PerformanceDashboard.jsx';

/**
 * Module đã được tái cấu trúc (Refactored) thành Module Thống kê Hiệu suất Giảng dạy (Teaching Performance Stats).
 * Toàn bộ logic tiền bạc, kế toán, thu nhập đã được loại bỏ hoàn toàn.
 * Component này re-export PerformanceDashboard để tương thích ngược 100% với các route cũ.
 */
export function CoachSalaryKPI(props) {
  return <PerformanceDashboard {...props} />;
}

export default CoachSalaryKPI;
