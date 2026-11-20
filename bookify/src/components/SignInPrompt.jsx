import { useAuth } from '../lib/authContext'

export default function SignInPrompt({ title, message }) {
  const { requireAuth } = useAuth()
  return (
    <section className="sign-in-prompt" aria-labelledby="sign-in-prompt-heading">
      <span className="eyebrow">MEMBERS ONLY</span>
      <h1 className="page-title" id="sign-in-prompt-heading">{title}</h1>
      <p className="intro">{message}</p>
      <div className="sign-in-prompt-actions">
        <button className="primary-button" onClick={() => requireAuth(message)}>Sign in</button>
        <button className="secondary-button" onClick={() => requireAuth(message, 'register')}>Create an account</button>
      </div>
    </section>
  )
}
