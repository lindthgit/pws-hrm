import React from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import LoginPage from './pages/LoginPage'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import PlannerPage from './pages/PlannerPage'
import WorkOrderTimePage from './pages/WorkOrderTimePage'
import FleetPage from './pages/FleetPage'
import ApprovalsPage from './pages/ApprovalsPage'
import SelfServicePage from './pages/SelfServicePage'
import ProfilePage from './pages/ProfilePage'
import MasterDataPage from './pages/MasterDataPage'

function MainRouter() {
  const { loggedUser, authLoading } = useAuth()
  const { activeTab, dataLoading, canViewModule } = useApp()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0d9488] mx-auto flex items-center justify-center font-extrabold text-lg animate-pulse">
            PWS
          </div>
          <div className="text-xs font-semibold text-slate-300">กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</div>
        </div>
      </div>
    )
  }

  if (!loggedUser) {
    return <LoginPage />
  }

  return (
    <AppShell>
      {dataLoading ? (
        <div className="p-12 text-center text-xs font-semibold text-slate-500">
          กำลังซิงค์ข้อมูลล่าสุดจาก Supabase Cloud...
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && canViewModule('dashboard') && <DashboardPage />}
          {activeTab === 'planner' && canViewModule('planner') && <PlannerPage />}
          {activeTab === 'clerk' && canViewModule('clerk') && <WorkOrderTimePage />}
          {activeTab === 'fleet' && canViewModule('fleet') && <FleetPage />}
          {activeTab === 'approvals' && canViewModule('approvals') && <ApprovalsPage />}
          {activeTab === 'selfservice' && canViewModule('selfservice') && <SelfServicePage />}
          {activeTab === 'profile' && <ProfilePage />}
          {activeTab === 'master' && canViewModule('master') && <MasterDataPage />}
        </>
      )}
    </AppShell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainRouter />
      </AppProvider>
    </AuthProvider>
  )
}
