import React, { useEffect, useState } from 'react';
import { ownerApi } from '../../api/ownerApi';
import LocationPickerMap from '../../components/map/LocationPickerMap';
import { SPORT_TYPES, getSportLabel } from '../../constants/sportTypes';
import styles from './OwnerManagementPanels.module.scss';

const EMPTY_FORM = {
  fieldName: '',
  address: '',
  sportType: 'FOOTBALL',
  mapValue: null
};

export default function FormManageFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await ownerApi.getMyFields();
      setFields(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg('Không tải được danh sách field');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const startEdit = (f) => {
    setEditingId(f.id);
    setEditForm({
      fieldName: f.name || '',
      address: f.address || '',
      sportType: f.sportType || 'FOOTBALL',
      mapValue:
        f.latitude != null && f.longitude != null
          ? { lat: Number(f.latitude), lng: Number(f.longitude) }
          : null
    });
    setMsg('');
    setMsgType('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const handleSave = async (id) => {
    if (!editForm.fieldName.trim()) {
      setMsg('Tên field không được để trống');
      setMsgType('error');
      return;
    }

    if (!editForm.address.trim()) {
      setMsg('Vui lòng nhập địa chỉ');
      setMsgType('error');
      return;
    }

    if (!editForm.mapValue) {
      setMsg('Vui lòng ghim vị trí trên bản đồ');
      setMsgType('error');
      return;
    }

    try {
      setSaving(true);

      await ownerApi.updateField(id, {
        fieldName: editForm.fieldName.trim(),
        address: editForm.address.trim(),
        sportType: editForm.sportType,
        latitude: editForm.mapValue.lat,
        longitude: editForm.mapValue.lng
      });

      setMsg('Cập nhật thành công');
      setMsgType('success');
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      await loadFields();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Cập nhật thất bại');
      setMsgType('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa field này?')) return;

    try {
      setDeletingId(id);
      await ownerApi.deleteField(id);
      setMsg('Xóa thành công');
      setMsgType('success');
      await loadFields();
    } catch (e) {
      setMsg(e?.response?.data?.message || 'Xóa thất bại');
      setMsgType('error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFindAddressOnMap = async () => {
    if (!editForm.address?.trim()) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          editForm.address
        )}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        setEditForm((prev) => ({
          ...prev,
          mapValue: { lat, lng }
        }));
      } else {
        alert('Không tìm thấy địa chỉ này trên bản đồ.');
      }
    } catch (e) {
      console.error('Lỗi tìm địa chỉ', e);
      alert('Có lỗi khi tìm địa chỉ trên bản đồ.');
    }
  };

  const handleMapChange = async (val) => {
    setEditForm((prev) => ({
      ...prev,
      mapValue: val
    }));

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${val.lat}&lon=${val.lng}`
      );
      const data = await res.json();

      if (data && data.display_name) {
        setEditForm((prev) => ({
          ...prev,
          address: data.display_name
        }));
      }
    } catch (e) {
      console.error('Lỗi lấy địa chỉ tự động', e);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Quản lý Field</div>

      {msg && (
        <div className={`${styles.msg} ${styles[msgType]}`}>
          {msg}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <div>Đang tải...</div>
        </div>
      )}

      {!loading && fields.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏟️</div>
          <div>Chưa có field</div>
        </div>
      )}

      {!loading && (
        <div className={styles.list}>
          {fields.map((f) => {
            const isEditing = editingId === f.id;

            return (
              <div key={f.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMain}>
                    <div className={styles.fieldName}>{f.name}</div>
                    <div className={styles.fieldAddress}>{f.address}</div>

                    <div className={styles.metaRow}>
                      <span className={styles.sportTag}>
                        {getSportLabel(f.sportType)}
                      </span>
                      <span className={styles.statusBadge}>
                        {f.status}
                      </span>
                    </div>

                    <div className={styles.coords}>
                      {f.latitude} - {f.longitude}
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={() => startEdit(f)}
                    >
                      Edit
                    </button>

                    <button
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => handleDelete(f.id)}
                      disabled={deletingId === f.id}
                    >
                      {deletingId === f.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className={styles.editForm}>
                    <div className={styles.fieldGrid}>
                      <div className={styles.inputGroup}>
                        <label>Tên field</label>
                        <input
                          value={editForm.fieldName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              fieldName: e.target.value
                            })
                          }
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <label>Môn thể thao</label>
                        <select
                          value={editForm.sportType}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              sportType: e.target.value
                            })
                          }
                        >
                          {SPORT_TYPES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div
                        className={styles.inputGroup}
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <label>Địa chỉ</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            value={editForm.address}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                address: e.target.value
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={handleFindAddressOnMap}
                            style={{
                              padding: '0 16px',
                              background: 'rgba(255,255,255,0.1)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: '#fff',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              fontSize: '0.85rem'
                            }}
                          >
                            🔍 Tìm trên Map
                          </button>
                        </div>
                      </div>

                      <div
                        className={styles.inputGroup}
                        style={{ gridColumn: '1 / -1' }}
                      >
                        <label>Ghim vị trí trên bản đồ</label>
                        <div
                          style={{
                            height: 260,
                            borderRadius: 8,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <LocationPickerMap
                            value={editForm.mapValue}
                            onChange={handleMapChange}
                          />
                        </div>

                        {editForm.mapValue && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: '#9ca3af',
                              marginTop: 8
                            }}
                          >
                            Đã ghim: {editForm.mapValue.lat.toFixed(5)},{' '}
                            {editForm.mapValue.lng.toFixed(5)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => handleSave(f.id)}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}