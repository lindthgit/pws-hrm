import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const STORAGE_KEY_EMP_ID = 'pws_hrm_logged_emp_id'
const STORAGE_KEY_DEV_IMPERSONATE = 'pws_hrm_dev_impersonate_id'

export function AuthProvider({ children }) {
  const [loggedUser, setLoggedUser] = useState(null)
  const [impersonatedUser, setImpersonatedUser] = useState(null)
  const [devSimTimeMode, setDevSimTimeMode] = useState('real') // 'real' | 'before17' | 'after17'
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    async function restoreSession() {
      setAuthLoading(true)
      try {
        const savedId = localStorage.getItem(STORAGE_KEY_EMP_ID)
        if (!savedId) {
          setAuthLoading(false)
          return
        }
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', savedId)
          .eq('is_active', true)
          .maybeSingle()

        if (!error && data) {
          setLoggedUser(data)
          if (data.is_developer) {
            const impId = localStorage.getItem(STORAGE_KEY_DEV_IMPERSONATE) || 'E-01'
            const { data: impData } = await supabase
              .from('employees')
              .select('*')
              .eq('id', impId)
              .maybeSingle()
            if (impData) {
              setImpersonatedUser(impData)
            }
          }
        } else {
          localStorage.removeItem(STORAGE_KEY_EMP_ID)
        }
      } catch (err) {
        console.error('Restore session error:', err)
      } finally {
        setAuthLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function login(empCode, pinCode) {
    setAuthError('')
    const cleanCode = String(empCode || '').trim().toUpperCase()
    const cleanPin = String(pinCode || '').trim()

    if (!cleanCode || !cleanPin) {
      setAuthError('กรุณากรอกรหัสพนักงานและรหัส PIN ให้ครบถ้วน')
      return { ok: false }
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .ilike('emp_code', cleanCode)
      .eq('pin_code', cleanPin)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      setAuthError('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ' + error.message)
      return { ok: false }
    }

    if (!data) {
      setAuthError('รหัสพนักงาน หรือ PIN ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง')
      return { ok: false }
    }

    setLoggedUser(data)
    localStorage.setItem(STORAGE_KEY_EMP_ID, data.id)

    if (data.is_developer) {
      // Default developer impersonation to Owner 1 (E-01) so dev sees full system immediately
      const { data: defaultOwner } = await supabase
        .from('employees')
        .select('*')
        .eq('id', 'E-01')
        .maybeSingle()
      const target = defaultOwner || data
      setImpersonatedUser(target)
      localStorage.setItem(STORAGE_KEY_DEV_IMPERSONATE, target.id)
    } else {
      setImpersonatedUser(null)
      localStorage.removeItem(STORAGE_KEY_DEV_IMPERSONATE)
    }

    return { ok: true, user: data }
  }

  function logout() {
    setLoggedUser(null)
    setImpersonatedUser(null)
    setDevSimTimeMode('real')
    localStorage.removeItem(STORAGE_KEY_EMP_ID)
    localStorage.removeItem(STORAGE_KEY_DEV_IMPERSONATE)
  }

  async function switchDeveloperImpersonation(targetEmployee) {
    if (!loggedUser?.is_developer || !targetEmployee) return
    setImpersonatedUser(targetEmployee)
    localStorage.setItem(STORAGE_KEY_DEV_IMPERSONATE, targetEmployee.id)
  }

  function updateUserData(updatedEmp) {
    if (!updatedEmp) return
    setLoggedUser(prev => (prev?.id === updatedEmp.id ? { ...prev, ...updatedEmp } : prev))
    setImpersonatedUser(prev => (prev?.id === updatedEmp.id ? { ...prev, ...updatedEmp } : prev))
  }

  // Effective user whose role & identity govern the UI
  const activeUser = loggedUser?.is_developer
    ? (impersonatedUser || loggedUser)
    : loggedUser

  // Normalize effective role key ('owner', 'hr', 'clerk', 'lead', 'worker')
  const rawRole = activeUser?.app_role || 'worker'
  const effectiveRole = rawRole === 'developer'
    ? 'owner'
    : (rawRole === 'engineer' ? 'lead' : rawRole)

  const value = {
    loggedUser,
    activeUser,
    effectiveRole,
    isDeveloper: Boolean(loggedUser?.is_developer),
    devSimTimeMode,
    setDevSimTimeMode,
    authLoading,
    authError,
    setAuthError,
    login,
    logout,
    switchDeveloperImpersonation,
    updateUserData
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
