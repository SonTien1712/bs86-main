import '../../styles/PersonalInfoForm.css'

function PersonalInfoForm({ formData, onChange, onSubmit, loading }) {
  const handleChange = (field, value) => {
    onChange({
      ...formData,
      [field]: value,
    })
  }

  return (
    <form className="personal-info-form" onSubmit={onSubmit}>
      <div className="form-group">
        <label className="form-label">Tên của bạn</label>
        <input
          type="text"
          className="form-input"
          placeholder="Nhập tên đầy đủ"
          value={formData.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Số điện thoại</label>
        <div className="phone-input-wrapper">
          <select className="country-code">
            <option value="+84">🇻🇳 +84</option>
          </select>
          <input
            type="tel"
            className="form-input phone-input"
            placeholder="Nhập số điện thoại"
            value={formData.customerPhone}
            onChange={(e) => handleChange('customerPhone', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-input"
          placeholder="Nhập email"
          value={formData.customerEmail}
          onChange={(e) => handleChange('customerEmail', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Phương thức thanh toán</label>
        <div className="payment-methods">
          <label className="payment-option">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={formData.paymentMethod === 'cash'}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            />
            <span>Tiền mặt</span>
          </label>
          <label className="payment-option">
            <input
              type="radio"
              name="paymentMethod"
              value="bank"
              checked={formData.paymentMethod === 'bank'}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            />
            <span>Chuyển khoản ngân hàng</span>
          </label>
          <label className="payment-option">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={formData.paymentMethod === 'card'}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            />
            <span>Thẻ tín dụng / Ghi nợ</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={loading}
      >
        {loading ? 'Đang xử lý...' : 'Xác nhận & Thanh toán'}
      </button>
    </form>
  )
}

export default PersonalInfoForm
