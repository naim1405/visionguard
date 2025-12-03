import apiClient from '../api/axios'
import { Shop, CreateShopRequest, UpdateShopRequest, Manager } from '@/types'

// Transform backend response (snake_case) to frontend format (camelCase)
const transformShop = (shop: any): Shop => ({
  ...shop,
  telegramChatId: shop.telegram_chat_id,
})

export const shopService = {
  async getAllShops(): Promise<Shop[]> {
    const response = await apiClient.get<any[]>('/shops')
    return response.data.map(transformShop)
  },

  async getShop(shopId: string): Promise<Shop> {
    const response = await apiClient.get<any>(`/shops/${shopId}`)
    return transformShop(response.data)
  },

  async createShop(shopData: CreateShopRequest): Promise<Shop> {
    const response = await apiClient.post<any>('/shops', shopData)
    return transformShop(response.data)
  },

  async updateShop(shopId: string, shopData: UpdateShopRequest): Promise<Shop> {
    const response = await apiClient.put<any>(`/shops/${shopId}`, shopData)
    return transformShop(response.data)
  },

  async deleteShop(shopId: string): Promise<void> {
    await apiClient.delete(`/shops/${shopId}`)
  },

  async getShopManagers(shopId: string): Promise<Manager[]> {
    const response = await apiClient.get<Manager[]>(`/shops/${shopId}/managers`)
    return response.data
  },

  async assignManager(shopId: string, managerEmail: string): Promise<Shop> {
    const response = await apiClient.post<any>(`/shops/${shopId}/managers`, {
      email: managerEmail,
    })
    return transformShop(response.data)
  },

  async removeManager(shopId: string, managerId: string): Promise<void> {
    await apiClient.delete(`/shops/${shopId}/managers/${managerId}`)
  },

  async checkManagerEmail(email: string): Promise<{ exists: boolean; email: string }> {
    const response = await apiClient.post<{ exists: boolean; email: string }>(
      '/shops/check-manager-email',
      { email }
    )
    return response.data
  },
}
