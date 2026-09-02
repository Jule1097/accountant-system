"use client"

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useToastManager } from 'src/components/ui/toast'
import { ApiRequestError } from 'src/lib/api/api-client'
import { clientSupplierUnexpectedError } from 'src/lib/constants/messages'
import { useResourceMutation } from 'src/hooks/shared/use-resource'
import { createClientSupplierMutationAdapter } from 'src/lib/helpers/third-party/third-party-resource-adapter'
import { clientSupplierSchema } from 'src/lib/schemas/third-party/third-party-schemas'
import {
  buildClientSupplierResolvedFeedback,
  buildClientSupplierSaveFeedback,
  buildClientSupplierSubmitErrorFeedback,
} from 'src/lib/helpers/third-party/third-party-ui'
import { ClientSupplierFormValues, ClientSupplierModalProps } from 'src/types/third-party/third-party-resource'

export function useClientSupplierForm({
  isOpen,
  type,
  mode,
  record,
  initialValues,
  onOpenChange,
  onSuccess,
  onResolveDuplicate,
}: ClientSupplierModalProps) {
  const toastManager = useToastManager()
  const { create, update } = useResourceMutation({
    adapter: createClientSupplierMutationAdapter(type),
  })
  const form = useForm<ClientSupplierFormValues>({
    resolver: zodResolver(clientSupplierSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      cuit: '',
    },
  })
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form
  const nameValue = useWatch({ control, name: 'name' })
  const cuitValue = useWatch({ control, name: 'cuit' })
  const isSubmitDisabled = !nameValue?.trim() || !cuitValue?.trim() || !isValid || isSubmitting

  useEffect(() => {
    if (!isOpen) {
      return
    }

    reset({
      name: record?.name || initialValues?.name || '',
      cuit: record?.cuit || initialValues?.cuit || '',
    })
  }, [initialValues?.cuit, initialValues?.name, isOpen, record?.cuit, record?.name, reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const savedRecord = mode === 'edit' && record?.id
        ? await update(record.id, values)
        : await create(values)

      await onSuccess?.(savedRecord)
      onOpenChange(false)
      toastManager.add(buildClientSupplierSaveFeedback(type, mode))
    } catch (error) {
      if (mode === 'create' && error instanceof ApiRequestError && error.status === 409 && onResolveDuplicate) {
        const resolvedRecord = await onResolveDuplicate(values)

        if (resolvedRecord) {
          onOpenChange(false)
          toastManager.add(buildClientSupplierResolvedFeedback(type))
          return
        }
      }

      toastManager.add(buildClientSupplierSubmitErrorFeedback(
        mode,
        error instanceof Error ? error.message : clientSupplierUnexpectedError
      ))
    }
  })

  return {
    register,
    errors,
    isSubmitting,
    isSubmitDisabled,
    onSubmit,
  }
}
