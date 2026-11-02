import { refundApi, receptionApi } from '../../../services/api.js';
import * as paymentCheckout from '../../../services/paymentCheckout.js';

export const paymentApi = {
  ...paymentCheckout,
  getInvoices: (params) => receptionApi.getInvoices(params),
  createInvoice: (data) => receptionApi.createInvoice(data),
  refunds: refundApi
};

export { refundApi };
export default paymentApi;

