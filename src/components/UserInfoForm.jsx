import React from 'react';

export default function UserInfoForm({ userInfo, onChange, onSubmit, formError }) {
  return (
    <form className="user-info-form" onSubmit={onSubmit} style={{
      width: 380,
      background: '#23232b',
      borderRadius: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    }}>
      <h2 style={{ marginBottom: 8, textAlign: 'center' }}>Enter your details to begin</h2>
      <input name="name" value={userInfo.name} onChange={onChange} placeholder="Full Name" style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
      <input name="panther" value={userInfo.panther} onChange={onChange} placeholder="Panther ID" style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
      <input name="email" value={userInfo.email} onChange={onChange} placeholder="Student Email" type="email" style={{ padding: 12, borderRadius: 6, border: '1px solid #ddd' }} />
      {formError && <div style={{ color: '#c00', fontSize: '0.97em' }}>{formError}</div>}
      <button type="submit" style={{ background: '#1e90ff', color: '#fff', border: 'none', borderRadius: 6, padding: '14px 0', fontWeight: 600, fontSize: '1.09em', marginTop: 8, cursor: 'pointer' }}>Continue</button>
    </form>
  );
}
