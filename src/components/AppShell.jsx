import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import DeveloperBar from './DeveloperBar'
import { formatThaiDateShort } from '../lib/dateUtils'

export default function AppShell({ children }) {
  const { activeUser, effectiveRole, logout } = useAuth()
  const {
    activeTab,
    setActiveTab,
    leaveRequests,
    otRequests,
    officeSites,
    teams,
    employees,
    toastMessage,
    canViewModule
  } = useApp()

  const [notifOpen, setNotifOpen] = useState(false)

  // Role-based notification logic:
  // - Owner / HR: see all pending leaves & OT needing approval
  // - Clerk: see pending items for their branch site
  // - Lead: see pending items for their team
  // - Worker: do NOT see notifications to approve others; only see their own requests
  let notifItems = []
  let notifBadgeCount = 0

  if (effectiveRole === 'owner' || effectiveRole === 'hr') {
    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending')
    const pendingOts = otRequests.filter(o => o.status === 'pending')
    notifBadgeCount = pendingLeaves.length + pendingOts.length
    notifItems = [
      ...pendingLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        icon: '🏖️',
        title: `ขอ${lv.leave_type}: ${lv.worker_name}`,
        subtitle: `${formatThaiDateShort(lv.start_date)} (${lv.total_days} วัน) • ${lv.reason}`,
        actionHint: 'คลิกเพื่อไปหน้า วันลา & OT →',
        targetTab: 'approvals'
      })),
      ...pendingOts.map(ot => ({
        id: `ot-${ot.id}`,
        icon: '⏱️',
        title: `ขอ OT: ${ot.worker_name} (${ot.team_name})`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'คลิกเพื่อไปหน้า วันลา & OT →',
        targetTab: 'approvals'
      }))
    ]
  } else if (effectiveRole === 'clerk') {
    // Clerk sees pending requests from workers stationed in their branch
    const branchWorkerIds = new Set(
      employees.filter(e => e.office_site_id === activeUser?.office_site_id).map(e => e.id)
    )
    const branchLeaves = leaveRequests.filter(l => l.status === 'pending' && branchWorkerIds.has(l.worker_id))
    const branchOts = otRequests.filter(o => o.status === 'pending' && branchWorkerIds.has(o.worker_id))
    notifBadgeCount = branchLeaves.length + branchOts.length
    notifItems = [
      ...branchLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        icon: '🏖️',
        title: `คำขอลาสาขา: ${lv.worker_name}`,
        subtitle: `${formatThaiDateShort(lv.start_date)} • ${lv.leave_type} (${lv.reason})`,
        actionHint: 'คลิกเพื่อดูสถานะ →',
        targetTab: 'approvals'
      })),
      ...branchOts.map(ot => ({
        id: `ot-${ot.id}`,
        icon: '⏱️',
        title: `คำขอ OT สาขา: ${ot.worker_name}`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'คลิกเพื่อดูสถานะ →',
        targetTab: 'approvals'
      }))
    ]
  } else if (effectiveRole === 'lead') {
    // Lead sees pending requests from their team
    const teamWorkerIds = new Set(
      employees.filter(e => e.team_id === activeUser?.team_id).map(e => e.id)
    )
    const teamLeaves = leaveRequests.filter(l => l.status === 'pending' && teamWorkerIds.has(l.worker_id))
    const teamOts = otRequests.filter(o => o.status === 'pending' && teamWorkerIds.has(o.worker_id))
    notifBadgeCount = teamLeaves.length + teamOts.length
    notifItems = [
      ...teamLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        icon: '🏖️',
        title: `สมาชิกในทีมขอลา: ${lv.worker_name}`,
        subtitle: `${formatThaiDateShort(lv.start_date)} • ${lv.leave_type}`,
        actionHint: 'ดูสถานะ →',
        targetTab: 'selfservice'
      })),
      ...teamOts.map(ot => ({
        id: `ot-${ot.id}`,
        icon: '⏱️',
        title: `สมาชิกในทีมขอ OT: ${ot.worker_name}`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'ดูสถานะ →',
        targetTab: 'selfservice'
      }))
    ]
  } else {
    // Worker: 0 badge count (workers do NOT have approval duties!)
    // If they open notification drawer, show their own recent status
    const myRecentLeaves = leaveRequests.filter(l => l.worker_id === activeUser?.id).slice(0, 3)
    const myRecentOts = otRequests.filter(o => o.worker_id === activeUser?.id).slice(0, 3)
    notifBadgeCount = 0
    notifItems = [
      ...myRecentLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        icon: '🏖️',
        title: `ใบลาของคุณ: ${lv.leave_type} (${lv.status === 'approved' ? '✓ อนุมัติแล้ว' : lv.status === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'})`,
        subtitle: `${formatThaiDateShort(lv.start_date)} (${lv.total_days} วัน) • ${lv.reason}`,
        actionHint: 'ดูข้อมูลส่วนตัว →',
        targetTab: 'profile'
      })),
      ...myRecentOts.map(ot => ({
        id: `ot-${ot.id}`,
        icon: '⏱️',
        title: `คำขอ OT ของคุณ (${ot.status === 'approved' ? '✓ อนุมัติแล้ว' : ot.status === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'})`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'ดูข้อมูลส่วนตัว →',
        targetTab: 'profile'
      }))
    ]
  }

  const roleLabels = {
    owner: { text: 'เจ้าของกิจการ (Owner)', badge: 'bg-cyan-100 text-cyan-900 border-cyan-200' },
    hr: { text: 'ฝ่ายบุคคล (HR)', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    clerk: { text: 'เสมียนประจำสาขา', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
    lead: { text: 'หัวหน้าทีม / วิศวกร', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    worker: { text: 'พนักงานประจำ', badge: 'bg-slate-100 text-slate-700 border-slate-200' }
  }

  const currentRoleMeta = roleLabels[effectiveRole] || roleLabels.worker
  const userOfficeSite = officeSites.find(s => s.id === activeUser?.office_site_id)
  const userTeam = teams.find(t => t.id === activeUser?.team_id)

  const allNavItems = [
    { id: 'dashboard', label: 'ภาพรวม', icon: '📊' },
    { id: 'planner', label: 'วางแผนเดือน', icon: '📅' },
    { id: 'clerk', label: 'ใบงาน/ลงเวลา', icon: '📋' },
    { id: 'fleet', label: 'สถานะรถ', icon: '🚛' },
    {
      id: 'approvals',
      label: 'วันลา & OT',
      icon: '✅',
      badgeCount: (effectiveRole === 'owner' || effectiveRole === 'hr') ? notifBadgeCount : 0
    },
    { id: 'selfservice', label: 'ยื่นใบลา / OT', icon: '📝' },
    { id: 'master', label: 'ตั้งค่าระบบ', icon: '⚙️' },
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: '👤' }
  ]

  const visibleNavItems = allNavItems.filter(item => canViewModule(item.id, effectiveRole))

  function handleNotifItemClick(targetTab) {
    setNotifOpen(false)
    if (targetTab) setActiveTab(targetTab)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Developer Impersonation Toolbar (Visible ONLY to DEV login) */}
      <DeveloperBar />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand with Marine / Ocean Blue Theme */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab(visibleNavItems[0]?.id || 'profile')}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0d9488] flex items-center justify-center text-white font-extrabold text-sm shadow-xs cursor-pointer"
            >
              PWS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  PWS Operations
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${currentRoleMeta.badge}`}>
                  {currentRoleMeta.text}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-700">{activeUser?.name}</span>
                {userTeam && <span>• {userTeam.name}</span>}
                {userOfficeSite && <span>• สาขา{userOfficeSite.name}</span>}
              </div>
            </div>
          </div>

          {/* Right Actions: Notifications, Profile, Logout */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="การแจ้งเตือน"
              >
                <span className="text-base">🔔</span>
                {notifBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {notifBadgeCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <span className="text-xs font-bold">
                      🔔 การแจ้งเตือน {notifBadgeCount > 0 ? `(${notifBadgeCount} รายการ)` : ''}
                    </span>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        ไม่มีรายการแจ้งเตือนในขณะนี้
                      </div>
                    ) : (
                      notifItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleNotifItemClick(item.targetTab)}
                          className="w-full text-left p-3 hover:bg-cyan-50/70 transition flex items-start gap-2.5"
                        >
                          <span className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center text-xs font-bold shrink-0">
                            {item.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {item.subtitle}
                            </div>
                            <div className="text-[10px] text-cyan-700 font-semibold mt-0.5">
                              {item.actionHint}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile quick button */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                activeTab === 'profile'
                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                  : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
              }`}
            >
              <span>👤</span>
              <span className="hidden sm:inline">{activeUser?.emp_code}</span>
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200"
              title="ออกจากระบบ"
            >
              ออก
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Desktop Sidebar */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200 p-3 justify-between">
          <nav className="space-y-1">
            {visibleNavItems.map(item => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white text-cyan-800' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User footer removed per request */}
        </aside>

        {/* Main Page View */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop lg+) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-1 py-1">
        <div className="flex items-center justify-around">
          {visibleNavItems.map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[52px] transition ${
                  isActive ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[10px] mt-1 truncate max-w-[64px]">{item.label}</span>
                {item.badgeCount > 0 && (
                  <span className="absolute top-0.5 right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 lg:bottom-6 right-4 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-bounce">
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}
    </div>
  )
}
