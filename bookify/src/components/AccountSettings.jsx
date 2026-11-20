import { useState } from 'react'
import { authApi } from '../lib/api'

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState({ busy: false, error: '', message: '' })

  async function submit(event) {
    event.preventDefault()
    setStatus({ busy: true, error: '', message: '' })
    try {
      await authApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setStatus({ busy: false, error: '', message: 'Password changed. Other devices have been signed out.' })
    } catch (error) {
      setStatus({ busy: false, error: error.message, message: '' })
    }
  }

  return (
    <details className="account-panel">
      <summary>Change password</summary>
      <form onSubmit={submit}>
        <label htmlFor="current-password">Current password</label>
        <input id="current-password" type="password" autoComplete="current-password" required
          value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={200}
          value={newPassword} onChange={event => setNewPassword(event.target.value)} />
        <small>Use at least 12 characters.</small>
        {status.error && <p className="auth-error" role="alert">{status.error}</p>}
        {status.message && <p className="auth-message" role="status">{status.message}</p>}
        <button disabled={status.busy}>{status.busy ? 'Saving…' : 'Save new password'}</button>
      </form>
    </details>
  )
}

function DeleteAccount({ onDeleted }) {
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await authApi.deleteAccount(password)
      onDeleted()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <details className="account-panel danger">
      <summary>Delete account</summary>
      <form onSubmit={submit}>
        <p>This permanently deletes your account, playlists, ratings, notes and followers. It cannot be undone.</p>
        <label htmlFor="delete-password">Password</label>
        <input id="delete-password" type="password" autoComplete="current-password" required
          value={password} onChange={event => setPassword(event.target.value)} />
        <label className="visibility-choice">
          <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
          I understand that my account and library will be deleted
        </label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button disabled={busy || !confirmed}>{busy ? 'Deleting…' : 'Delete my account'}</button>
      </form>
    </details>
  )
}

export default function AccountSettings({ onAccountDeleted }) {
  return (
    <section className="account-settings" aria-labelledby="account-settings-heading">
      <h2 id="account-settings-heading">Account</h2>
      <ChangePassword />
      <DeleteAccount onDeleted={onAccountDeleted} />
    </section>
  )
}
