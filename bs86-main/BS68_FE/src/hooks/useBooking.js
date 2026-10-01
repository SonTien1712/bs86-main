import { useState, useCallback } from 'react'
import { bookingAPI } from '../api/api'

export const useBooking = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [bookingData, setBookingData] = useState(null)

  const fetchAvailableCourts = useCallback(async (date) => {
    setLoading(true)
    setError(null)
    try {
      const data = await bookingAPI.getAvailableCourts(date)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCourtSchedule = useCallback(async (courtId, date) => {
    setLoading(true)
    setError(null)
    try {
      const data = await bookingAPI.getCourtSchedule(courtId, date)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createBooking = useCallback(async (data) => {
    setLoading(true)
    setError(null)
    try {
      const response = await bookingAPI.createBooking(data)
      setBookingData(response)
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    bookingData,
    fetchAvailableCourts,
    fetchCourtSchedule,
    createBooking,
  }
}
