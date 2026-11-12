import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import DeveloperBar from './DeveloperBar'
import { formatThaiDateShort } from '../lib/dateUtils'

// Monochrome SVG Icons (styled by currentColor)
export function NavIcon({ name, className = "w-5 h-5" }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      )
    case 'planner':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'clerk':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      )
    case 'fleet':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      )
    case 'approvals':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'selfservice':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    case 'master':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'profile':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'more':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
        </svg>
      )
    case 'bell':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      )
    case 'leave':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    case 'ot':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'trash':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )
    case 'lock':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )
    default:
      return null
  }
}

export default function AppShell({ children }) {
  const { activeUser, effectiveRole, logout } = useAuth()
  const {
    activeTab,
    setActiveTab,
    leaveRequests,
    otRequests,
    masterAuditLogs,
    officeSites,
    teams,
    employees,
    toastMessage,
    canViewModule
  } = useApp()

  const [notifOpen, setNotifOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  // Role-based notification logic:
  // - Owner / HR: see pending leaves, pending OTs, and recent Master Data audit logs
  // - Clerk: see pending items for their branch site
  // - Lead: see pending items for their team
  // - Worker: see their own recent requests
  let notifItems = []
  let notifBadgeCount = 0

  if (effectiveRole === 'owner' || effectiveRole === 'hr') {
    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending')
    const pendingOts = otRequests.filter(o => o.status === 'pending')
    const recentAudits = (masterAuditLogs || []).slice(0, 10)
    notifBadgeCount = pendingLeaves.length + pendingOts.length
    notifItems = [
      ...pendingLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        iconType: 'leave',
        title: `ขอ${lv.leave_type}: ${lv.worker_name}`,
        subtitle: `${formatThaiDateShort(lv.start_date)} (${lv.total_days} วัน) • ${lv.reason}`,
        actionHint: 'คลิกเพื่อไปหน้า วันลา & OT →',
        targetTab: 'approvals'
      })),
      ...pendingOts.map(ot => ({
        id: `ot-${ot.id}`,
        iconType: 'ot',
        title: `ขอ OT: ${ot.worker_name} (${ot.team_name})`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'คลิกเพื่อไปหน้า วันลา & OT →',
        targetTab: 'approvals'
      })),
      ...recentAudits.map(log => {
        let actionBadge = 'แก้ไข'
        if (log.action_type === 'delete') actionBadge = 'ลบ'
        if (log.action_type === 'create') actionBadge = 'เพิ่ม'
        if (log.action_type === 'permission_change') actionBadge = 'ปรับสิทธิ์'

        return {
          id: `audit-${log.id}`,
          iconType: log.action_type === 'delete' ? 'trash' : log.action_type === 'permission_change' ? 'lock' : 'master',
          title: `[${actionBadge}] ${log.target_name}`,
          subtitle: `${log.details || ''} • โดย ${log.performed_by_name} (${log.performed_by_role})`,
          actionHint: 'คลิกเพื่อดูประวัติตั้งค่าระบบ →',
          targetTab: 'master'
        }
      })
    ]
  } else if (effectiveRole === 'clerk') {
    const branchWorkerIds = new Set(
      employees.filter(e => e.office_site_id === activeUser?.office_site_id).map(e => e.id)
    )
    const branchLeaves = leaveRequests.filter(l => l.status === 'pending' && branchWorkerIds.has(l.worker_id))
    const branchOts = otRequests.filter(o => o.status === 'pending' && branchWorkerIds.has(o.worker_id))
    notifBadgeCount = branchLeaves.length + branchOts.length
    notifItems = [
      ...branchLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        iconType: 'leave',
        title: `คำขอลาสาขา: ${lv.worker_name}`,
        subtitle: `${formatThaiDateShort(lv.start_date)} • ${lv.leave_type} (${lv.reason})`,
        actionHint: 'คลิกเพื่อดูสถานะ →',
        targetTab: 'approvals'
      })),
      ...branchOts.map(ot => ({
        id: `ot-${ot.id}`,
        iconType: 'ot',
        title: `คำขอ OT สาขา: ${ot.worker_name}`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'คลิกเพื่อดูสถานะ →',
        targetTab: 'approvals'
      }))
    ]
  } else if (effectiveRole === 'lead') {
    const teamWorkerIds = new Set(
      employees.filter(e => e.team_id === activeUser?.team_id).map(e => e.id)
    )
    const teamLeaves = leaveRequests.filter(l => l.status === 'pending' && teamWorkerIds.has(l.worker_id))
    const teamOts = otRequests.filter(o => o.status === 'pending' && teamWorkerIds.has(o.worker_id))
    notifBadgeCount = teamLeaves.length + teamOts.length
    notifItems = [
      ...teamLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        iconType: 'leave',
        title: `สมาชิกในทีมขอลา: ${lv.worker_name}`,
        subtitle: `${formatThaiDateShort(lv.start_date)} • ${lv.leave_type}`,
        actionHint: 'ดูสถานะ →',
        targetTab: 'selfservice'
      })),
      ...teamOts.map(ot => ({
        id: `ot-${ot.id}`,
        iconType: 'ot',
        title: `สมาชิกในทีมขอ OT: ${ot.worker_name}`,
        subtitle: `${formatThaiDateShort(ot.date_val)} • ${ot.hours_slot}`,
        actionHint: 'ดูสถานะ →',
        targetTab: 'selfservice'
      }))
    ]
  } else {
    const myRecentLeaves = leaveRequests.filter(l => l.worker_id === activeUser?.id).slice(0, 3)
    const myRecentOts = otRequests.filter(o => o.worker_id === activeUser?.id).slice(0, 3)
    notifBadgeCount = 0
    notifItems = [
      ...myRecentLeaves.map(lv => ({
        id: `lv-${lv.id}`,
        iconType: 'leave',
        title: `ใบลาของคุณ: ${lv.leave_type} (${lv.status === 'approved' ? 'อนุมัติแล้ว' : lv.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ'})`,
        subtitle: `${formatThaiDateShort(lv.start_date)} (${lv.total_days} วัน) • ${lv.reason}`,
        actionHint: 'ดูข้อมูลส่วนตัว →',
        targetTab: 'profile'
      })),
      ...myRecentOts.map(ot => ({
        id: `ot-${ot.id}`,
        iconType: 'ot',
        title: `คำขอ OT ของคุณ (${ot.status === 'approved' ? 'อนุมัติแล้ว' : ot.status === 'rejected' ? 'ไม่อนุมัติ' : 'รออนุมัติ'})`,
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
    { id: 'dashboard', label: 'ภาพรวม' },
    { id: 'planner', label: 'วางแผนเดือน' },
    { id: 'clerk', label: 'ใบงาน/ลงเวลา' },
    { id: 'fleet', label: 'สถานะรถ' },
    {
      id: 'approvals',
      label: 'วันลา & OT',
      badgeCount: (effectiveRole === 'owner' || effectiveRole === 'hr') ? notifBadgeCount : 0
    },
    { id: 'selfservice', label: 'ยื่นใบลา / OT' },
    { id: 'master', label: 'ตั้งค่าระบบ' },
    { id: 'profile', label: 'ข้อมูลส่วนตัว' }
  ]

  const visibleNavItems = allNavItems.filter(item => canViewModule(item.id, effectiveRole))

  // Mobile Bottom Bar item breakdown rule:
  // If visible items <= 5, show ALL directly on the bottom bar! No "เพิ่มเติม" button needed.
  // If visible items > 5 (Owner/HR with 6-7 items), show top 4 + "เพิ่มเติม" (with the rest inside, and Master at the end).
  const hasMoreMenu = visibleNavItems.length > 5

  let mobilePrimaryTabs = []
  let mobileMoreItems = []

  if (!hasMoreMenu) {
    mobilePrimaryTabs = visibleNavItems
    mobileMoreItems = []
  } else {
    const primaryOrder = ['dashboard', 'clerk', 'fleet', 'approvals']
    mobilePrimaryTabs = primaryOrder
      .map(id => visibleNavItems.find(item => item.id === id))
      .filter(Boolean)

    const moreOrder = ['planner', 'selfservice', 'profile', 'master']
    mobileMoreItems = moreOrder
      .map(id => visibleNavItems.find(item => item.id === id))
      .filter(Boolean)
  }

  const isMoreTabActive = hasMoreMenu && mobileMoreItems.some(item => item.id === activeTab)

  function handleNotifItemClick(targetTab) {
    setNotifOpen(false)
    if (targetTab) setActiveTab(targetTab)
  }

  function handleSelectMobileTab(tabId) {
    setActiveTab(tabId)
    setMoreMenuOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Developer Impersonation Toolbar (Visible ONLY to DEV login) */}
      <DeveloperBar />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand with Marine Octopus Icon */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab(visibleNavItems[0]?.id || 'profile')}
              className="w-9 h-9 rounded-xl bg-[#0a1d30] border border-cyan-500/30 flex items-center justify-center p-1.5 shadow-xs cursor-pointer hover:border-cyan-400 transition"
              title="PWS Operations"
            >
              <img src="/favicon.svg" alt="PWS Octopus Logo" className="w-full h-full object-contain" />
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
                <NavIcon name="bell" className="w-5 h-5 text-slate-700" />
                {notifBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {notifBadgeCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-2">
                      <NavIcon name="bell" className="w-4 h-4 text-cyan-400" />
                      การแจ้งเตือน {notifBadgeCount > 0 ? `(${notifBadgeCount} รายการรออนุมัติ)` : ''}
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
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <NavIcon name={item.iconType || 'bell'} className="w-4 h-4 text-slate-600" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {item.subtitle}
                            </div>
                            <div className="text-[10px] text-[#0284c7] font-semibold mt-1">
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
                  ? 'bg-sky-50 text-[#0284c7] border-sky-200'
                  : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'
              }`}
            >
              <NavIcon name="profile" className="w-3.5 h-3.5" />
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
        {/* Desktop Sidebar (Solid active color, no gradient) */}
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
                      ? 'bg-[#0284c7] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <NavIcon name={item.id} className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white text-[#0284c7]' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Page View with safe bottom spacing for mobile nav bar */}
        <main className="flex-1 min-w-0 p-3 sm:p-5 pb-28 sm:pb-32 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop lg+) - Docked Glassmorphism */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-2 pt-2 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobilePrimaryTabs.map(item => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSelectMobileTab(item.id)}
                className={`relative flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition ${
                  isActive ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <NavIcon name={item.id} className="w-5 h-5" />
                <span className="text-[10px] mt-1 truncate max-w-[68px]">{item.label}</span>
                {item.badgeCount > 0 && (
                  <span className="absolute top-0 right-3 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {item.badgeCount}
                  </span>
                )}
              </button>
            )
          })}

          {/* "เพิ่มเติม" (More Button) - only when there are more than 5 tabs */}
          {hasMoreMenu && mobileMoreItems.length > 0 && (
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isMoreTabActive ? 'text-[#0284c7] font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <NavIcon name="more" className="w-5 h-5" />
              <span className="text-[10px] mt-1 truncate max-w-[68px]">เพิ่มเติม</span>
              {isMoreTabActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] mt-0.5"></span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile "เพิ่มเติม" (More Menu) Bottom Sheet */}
      {moreMenuOpen && hasMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end">
          <div
            className="flex-1"
            onClick={() => setMoreMenuOpen(false)}
          />
          <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <NavIcon name="more" className="w-4 h-4 text-slate-600" />
                เมนูเพิ่มเติม
              </span>
              <button
                onClick={() => setMoreMenuOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {mobileMoreItems.map(item => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMobileTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-sky-50 text-[#0284c7] border border-sky-200 shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#0284c7] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <NavIcon name={item.id} className="w-4 h-4" />
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="text-xs text-[#0284c7] font-extrabold">✓ กำลังดู</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 max-w-sm bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold">
          <span>{toastMessage.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}
    </div>
  )
}
