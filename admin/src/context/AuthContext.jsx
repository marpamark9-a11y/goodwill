import { createContext, useState, useContext } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  const login = (userData, token) => {
    const normalizedUser = {
      ...userData,
      role: userData.userType // normalize for ProtectedRoute
    }

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
    setUser(normalizedUser)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
