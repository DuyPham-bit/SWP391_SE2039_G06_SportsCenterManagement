import React from 'react';
import { MyBookings } from '../../features/booking';

export function MyBookingsPage(props) {
  return <MyBookings {...props} />;
}

export default MyBookingsPage;
export { MyBookingsPage as MyBookings };
