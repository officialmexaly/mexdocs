import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './types'

export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}
