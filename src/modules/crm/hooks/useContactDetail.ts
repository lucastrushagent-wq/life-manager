import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { crmService } from '../service'
import type { Interaction, KeyDate } from '../types'
import { CreateInteractionSchema, CreateKeyDateSchema } from '../schema'

export function useContactDetail(contactId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [keyDates, setKeyDates] = useState<KeyDate[]>([])

  const loadDetail = useCallback(async () => {
    const [ints, kds] = await Promise.all([
      crmService.getInteractions(contactId),
      crmService.getKeyDates(contactId),
    ])
    setInteractions(ints)
    setKeyDates(kds)
  }, [contactId])

  useEffect(() => { loadDetail() }, [loadDetail])

  async function addInteraction(input: z.infer<typeof CreateInteractionSchema>) {
    await crmService.addInteraction(contactId, input)
    setInteractions(await crmService.getInteractions(contactId))
  }

  async function deleteInteraction(interactionId: string) {
    await crmService.deleteInteraction(contactId, interactionId)
    setInteractions(prev => prev.filter(i => i.id !== interactionId))
  }

  async function addKeyDate(input: z.infer<typeof CreateKeyDateSchema>) {
    await crmService.addKeyDate(contactId, input)
    setKeyDates(await crmService.getKeyDates(contactId))
  }

  async function deleteKeyDate(keyDateId: string) {
    await crmService.deleteKeyDate(contactId, keyDateId)
    setKeyDates(prev => prev.filter(k => k.id !== keyDateId))
  }

  return { interactions, keyDates, addInteraction, deleteInteraction, addKeyDate, deleteKeyDate }
}
