"use client"

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useToastManager } from 'src/components/ui/toast'
import { ApiRequestError, apiRequest } from 'src/lib/api-client'
import { clientSupplierSchema } from 'src/lib/schemas/client-supplier-schemas'
import {
  resolveClientSupplierResolvedDescription,
  resolveClientSupplierResolvedTitle,
  resolveClientSupplierSubmitErrorTitle,
  resolveClientSupplierSuccessDescription,
  resolveClientSupplierSuccessTitle,
} from 'src/lib/helpers/client-supplier-ui'
import { ClientSupplierFormValues, ClientSupplierModalProps, ClientSupplierRecord } from 'src/types/client-supplier'

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
      const response = await apiRequest(mode === 'edit' && record?.id ? `/api/${type}/${record.id}` : `/api/${type}`, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      const savedRecord = await response.json() as ClientSupplierRecord

      await onSuccess?.(savedRecord)
      onOpenChange(false)
      toastManager.add({
        type: 'success',
        title: resolveClientSupplierSuccessTitle(type, mode),
        description: resolveClientSupplierSuccessDescription(type, mode),
      })
    } catch (error) {
      if (mode === 'create' && error instanceof ApiRequestError && error.status === 409 && onResolveDuplicate) {
        const resolvedRecord = await onResolveDuplicate(values)

        if (resolvedRecord) {
          onOpenChange(false)
          toastManager.add({
            type: 'success',
            title: resolveClientSupplierResolvedTitle(type),
            description: resolveClientSupplierResolvedDescription(type),
          })
          return
        }
      }

      toastManager.add({
        type: 'error',
        title: resolveClientSupplierSubmitErrorTitle(mode),
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      })
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
