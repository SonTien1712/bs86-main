import { useState, useEffect } from 'react'
import { profileApi } from '../api/customerApi'   // ✅ import đúng

export const useProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setError(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await profileApi.getProfile(userId)
        setProfile(data)
      } catch (err) {
        if (err.status === 404) {
          setProfile(null)
          setError(null)
        } else {
          setError(err.message || 'Failed to load profile')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId])

  const updateProfile = async (profileData) => {
    try {
      setLoading(true)
      setError(null)
      const updated = await profileApi.updateProfile(userId, profileData)
      setProfile(updated)
      return updated
    } catch (err) {
      setError(err.message || 'Failed to update profile')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async (profileData) => {
    try {
      setLoading(true)
      setError(null)
      const created = await profileApi.createProfile(profileData)
      setProfile(created)
      return created
    } catch (err) {
      setError(err.message || 'Failed to create profile')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      await profileApi.deleteProfile(userId)
      setProfile(null)
    } catch (err) {
      setError(err.message || 'Failed to delete profile')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { profile, loading, error, updateProfile, createProfile, deleteProfile }
}
