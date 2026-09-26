import { apiClient } from './client'
import { endpoints } from './endpoints'
import { customerSchema } from '../../domain/customer/customer.schema'
import { orderSchema } from '../../domain/orders/order.schema'
import { z } from 'zod'

export const listCrmCustomers = async () => customerSchema.array().parse((await apiClient.get(endpoints.crmCustomers)).data)
export const getCrmCustomer = async (customerId: string) =>
  z.object({ customer: customerSchema, recentOrders: orderSchema.array() }).parse((await apiClient.get(`${endpoints.crmCustomers}/${customerId}`)).data)
