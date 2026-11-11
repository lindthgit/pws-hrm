import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

export default function DeveloperBar() {
  const {
    isDeveloper,
    activeUser,
    switchDeveloperImpersonation,
    devSimTimeMode,
    setDevSimTimeMode
  } = useAuth()
  const { allAccounts } = useApp()

  // Strictly render ONLY when logged in as Developer (DEV / 9999)
  if (!isDeveloper) return null

  const quickRoles = [
    { label: '👑 เจ้าของ (วิชัย)', empId: 'E-01', role: 'owner' },
    { label: '👑 เจ้าของ 2 (สมศักดิ์)', empId: 'E-00', role: 'owner' },
    { label: '👩‍💼 HR (ศิริพร)', empId: 'E-02', role: 'hr' },
    { label: '📋 เสมียน (โรงเรือ)', empId: 'E-04', role: 'clerk' },
    { label: '📋 เสมียน (นากก)', empId: 'E-05', role: 'clerk' },
    { label: '📋 เสมียน (วัดใต้)', empId: 'E-06', role: 'clerk' },
    { label: '📋 เสมียน (คุระบุรี)', empId: 'E-07', role: 'clerk' },
    { label: '👷 หน.ทีม (โกแนน)', empId: 'W-01', role: 'lead' },
    { label: '🔧 พนักงาน (พี่ปาย)', empId: 'W-02', role: 'worker' }
  ]

  function handleSelectPreset(empId) {
    const target = allAccounts.find(a => a.id === empId)
    if (target) switchDeveloperImpersonation(target)
  }

  return (
    <div className="bg-slate-900 text-white border-b border-slate-700 px-3 py-1.5 text-xs z-50">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-extrabold text-[10px] tracking-wide uppercase">
            DEV MODE
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">สลับ Role ทดสอบ:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {quickRoles.map(qr => {
              const isSelected = activeUser?.id === qr.empId
              return (
                <button
                  key={qr.empId}
                  onClick={() => handleSelectPreset(qr.empId)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                    isSelected
                      ? 'bg-[#0284c7] text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {qr.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Select any employee from DB */}
          <select
            value={activeUser?.id || ''}
            onChange={e => handleSelectPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] font-medium focus:outline-none focus:border-cyan-400"
            title="เลือกจำลองเป็นพนักงานคนใดก็ได้ในฐานข้อมูล"
          >
            {allAccounts.filter(a => !a.is_developer).map(a => (
              <option key={a.id} value={a.id}>
                [{a.emp_code}] {a.name} ({a.app_role})
              </option>
            ))}
          </select>

          {/* Time Simulation for testing Before/After 17:00 cut-off */}
          <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 text-[10px]">
            <button
              onClick={() => setDevSimTimeMode('real')}
              className={`px-1.5 py-0.5 rounded ${devSimTimeMode === 'real' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
            >
              เวลาจริง
            </button>
            <button
              onClick={() => setDevSimTimeMode('before17')}
              className={`px-1.5 py-0.5 rounded ${devSimTimeMode === 'before17' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400'}`}
            >
              &lt;17:00
            </button>
            <button
              onClick={() => setDevSimTimeMode('after17')}
              className={`px-1.5 py-0.5 rounded ${devSimTimeMode === 'after17' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400'}`}
            >
              &gt;17:00
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
