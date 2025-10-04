import 'server-only'

import { userRepository } from '@/lib/repositories/user-repository'
import { AppUser } from '@/lib/types'

export const userService = {
  listAll: () => userRepository.listAll(),
  getById: (id: string) => userRepository.findById(id),
  async ensureUserRecord(user: AppUser) {
    await userRepository.upsert(user)
    return user
  }
}
