import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
export const useCapabilities = () => useQuery({ queryKey: ['capabilities'], queryFn: api.config.getCapabilities })
