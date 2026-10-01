import { useState } from 'react'
import { uploadToCloudinary } from '../../api/customerApi'
import './AvatarUpload.css'

export default function AvatarUpload({ onUpload, currentAvatar = null, disabled = false, userId }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentAvatar)
  const [error, setError] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn đúng định dạng ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng ảnh phải nhỏ hơn 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)

    try {
      setError(null)
      setUploading(true)
      const url = await uploadToCloudinary(file, userId)
      onUpload(url)
      setError(null)
    } catch (err) {
      setError(err.message || 'Tải ảnh lên thất bại')
      setPreview(currentAvatar)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="avatar-upload-container">
      <div className="avatar-display">
        {preview ? (
          <img src={preview} alt="Xem trước ảnh đại diện" className="avatar-image" />
        ) : (
          <div className="avatar-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
          </div>
        )}
      </div>

      <div className="avatar-controls">
        <label className="upload-button" style={{ pointerEvents: disabled || uploading ? 'none' : 'auto' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            style={{ display: 'none' }}
          />
          <span>{uploading ? 'Đang tải lên...' : 'Chọn ảnh'}</span>
        </label>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  )
}
