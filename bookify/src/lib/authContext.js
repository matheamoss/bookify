import { createContext, useContext } from 'react'

// user is null for guests. requireAuth(reason, mode) opens the sign-in dialog.
export const AuthContext = createContext({ user: null, requireAuth: () => {} })
export const useAuth = () => useContext(AuthContext)
