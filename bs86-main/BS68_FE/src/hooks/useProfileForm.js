import { useState, useCallback } from 'react'
import { validateProfileData } from '../schemas/profileSchema'  // ✅ giữ nguyên — cần tạo file này

export const useProfileForm = (initialData = {}) => {
  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    location: '',
    sportPreference: '',
    sportLevel: '',
    avatarUrl: '',
    ...initialData,
  }

  const [formData, setFormData] = useState(defaultValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      const validation = validateProfileData({ ...formData, [name]: value })
      setErrors((prev) => ({ ...prev, [name]: validation.errors[name] || '' }))
    }
  }, [formData, touched])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const validation = validateProfileData(formData)
    setErrors((prev) => ({ ...prev, [name]: validation.errors[name] || '' }))
  }, [formData])

  const setFieldValue = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }))
  }, [])

  const validateForm = useCallback(() => {
    const validation = validateProfileData(formData)
    setErrors(validation.errors)
    return validation.isValid
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData(defaultValues)
    setErrors({})
    setTouched({})
  }, [defaultValues])

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }, [])

  return {
    formData, errors, touched, isSubmitting, setIsSubmitting,
    handleChange, handleBlur, setFieldValue, setFieldTouched,
    setFieldError, validateForm, resetForm,
  }
}