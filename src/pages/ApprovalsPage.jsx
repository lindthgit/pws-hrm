import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import {
  formatThaiDateShort,
  formatThaiDateFull,
  getTodayISO,
  THAI_MONTHS_FULL,
  THAI_MONTHS_SHORT,
  THAI_DAYS_SHORT,
  getDaysInMonth
} from '../lib/dateUtils'

export const OT_PRESET_SLOTS = [
  { label: '17:30 - 22:00 น. (4.5 ชม.) [ค่าเริ่มต้น]', value: '17:30 - 22:00 น. (4.5 ชม.)', hours: 4.5 },
  { label: '17:30 - 20:30 น. (3.0 ชม.)', value: '17:30 - 20:30 น. (3.0 ชม.)', hours: 3.0 },
  { label: '17:30 - 19:30 น. (2.0 ชม.)', value: '17:30 - 19:30 น. (2.0 ชม.)', hours: 2.0 },
  { label: '17:30 - 24:00 น. (6.5 ชม.)', value: '17:30 - 24:00 น. (6.5 ชม.)', hours: 6.5 },
  { label: '08:00 - 17:00 น. (วันอาทิตย์ 8.0 ชม.)', value: '08:00 - 17:00 น. (8.0 ชม.)', hours: 8.0 }
]

export default function ApprovalsPage() {
  const { effectiveRole } = useAuth()
  const {
    leaveRequests,
    otRequests,
    teams,
    employees,
    decideLeaveRequest,
    decideOtRequest,
    submitLeaveRequest,
    submitOtRequests,
    showToast
  } = useApp()

  const [subtab, setSubtab] = useState('leave') // 'leave' | 'ot' | 'calendar'
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [otModalOpen, setOtModalOpen] = useState(false)
  const [leaveDetailModal, setLeaveDetailModal] = useState(null)

  // Leave Modal State
  const [lvWorkerId, setLvWorkerId] = useState(employees[0]?.id || 'W-01')
  const [lvType, setLvType] = useState('ลากิจ')
  const [lvStart, setLvStart] = useState(getTodayISO())
  const [lvEnd, setLvEnd] = useState(getTodayISO())
  const [lvReason, setLvReason] = useState('')

  // OT Modal State (Team + Multi-worker checklist)
  const [otTeamId, setOtTeamId] = useState(teams[0]?.id || 'team_nan')
  const [otCheckedWorkerIds, setOtCheckedWorkerIds] = useState(() =>
    employees.filter(e => e.team_id === (teams[0]?.id || 'team_nan')).map(w => w.id)
  )
  const [otDate, setOtDate] = useState(getTodayISO())
  const [otSlot, setOtSlot] = useState(OT_PRESET_SLOTS[0].value)
  const [otDesc, setOtDesc] = useState('')

  // Calendar State
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1) // 1 - 12
  const [calTeamFilter, setCalTeamFilter] = useState('all')
  const [calTypeFilter, setCalTypeFilter] = useState('all') // 'all' | 'ลาป่วย' | 'ลากิจ' | 'ลาพักร้อน'
  const [calStatusFilter, setCalStatusFilter] = useState('all') // 'all' (approved+pending) | 'approved'
  const [selectedCalDate, setSelectedCalDate] = useState(null)

  // Only Owner and HR can approve/reject; Clerk views only
  const canApprove = effectiveRole === 'owner' || effectiveRole === 'hr'

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending')
  const processedLeaves = leaveRequests.filter(l => l.status !== 'pending')

  const pendingOts = otRequests.filter(o => o.status === 'pending')
  const processedOts = otRequests.filter(o => o.status !== 'pending')

  function handleChangeOtTeam(newTeamId) {
    setOtTeamId(newTeamId)
    const members = employees.filter(e => e.team_id === newTeamId)
    setOtCheckedWorkerIds(members.map(m => m.id))
  }

  function toggleOtWorker(wid) {
    setOtCheckedWorkerIds(prev =>
      prev.includes(wid) ? prev.filter(id => id !== wid) : [...prev, wid]
    )
  }

  async function handleCreateLeave(e) {
    e.preventDefault()
    const d1 = new Date(lvStart)
    const d2 = new Date(lvEnd)
    const diffDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1)

    const ok = await submitLeaveRequest({
      workerId: lvWorkerId,
      leaveType: lvType,
      startDate: lvStart,
      endDate: lvEnd,
      totalDays: diffDays,
      reason: lvReason
    })
    if (ok) {
      setLvReason('')
      setLeaveModalOpen(false)
    }
  }

  async function handleCreateOt(e) {
    e.preventDefault()
    if (otCheckedWorkerIds.length === 0) {
      showToast('กรุณาติ๊กเลือกพนักงานที่จะทำ OT อย่างน้อย 1 คน', 'error')
      return
    }
    const foundSlot = OT_PRESET_SLOTS.find(s => s.value === otSlot) || OT_PRESET_SLOTS[0]
    const ok = await submitOtRequests({
      workerIds: otCheckedWorkerIds,
      dateVal: otDate,
      hoursSlot: foundSlot.value,
      otHours: foundSlot.hours,
      workDesc: otDesc
    })
    if (ok) {
      setOtDesc('')
      setOtModalOpen(false)
    }
  }

  // Month navigation helpers for Calendar
  function handlePrevMonth() {
    if (calMonth === 1) {
      setCalYear(y => y - 1)
      setCalMonth(12)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  function handleNextMonth() {
    if (calMonth === 12) {
      setCalYear(y => y + 1)
      setCalMonth(1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  function handleTodayMonth() {
    const now = new Date()
    setCalYear(now.getFullYear())
    setCalMonth(now.getMonth() + 1)
  }

  // Filter leaves for the selected month in Calendar
  const {
    daysInMonth,
    firstDayOfWeek,
    monthLeaves,
    dateLeavesMap,
    monthStats
  } = useMemo(() => {
    const dim = getDaysInMonth(calYear, calMonth)
    const fdw = new Date(calYear, calMonth - 1, 1).getDay() // 0 = Sun, 1 = Mon ...
    const mStart = `${calYear}-${String(calMonth).padStart(2, '0')}-01`
    const mEnd = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(dim).padStart(2, '0')}`

    const filtered = leaveRequests.filter(l => {
      // Must not be rejected
      if (l.status === 'rejected') return false
      // Status filter
      if (calStatusFilter === 'approved' && l.status !== 'approved') return false
      // Leave type filter
      if (calTypeFilter !== 'all' && l.leave_type !== calTypeFilter) return false
      // Team filter
      if (calTeamFilter !== 'all') {
        const emp = employees.find(e => e.id === l.worker_id)
        if (emp?.team_id !== calTeamFilter) return false
      }
      // Date range overlap with this month
      return l.end_date >= mStart && l.start_date <= mEnd
    })

    // Index leaves by date string
    const map = {}
    for (let d = 1; d <= dim; d++) {
      const iso = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      map[iso] = filtered.filter(l => iso >= l.start_date && iso <= l.end_date)
    }

    // Compute month stats
    const uniqueWorkers = new Set(filtered.map(l => l.worker_id)).size
    let totalLeaveDays = 0
    let sickCount = 0
    let personalCount = 0
    let annualCount = 0
    let pendingCount = 0

    filtered.forEach(l => {
      totalLeaveDays += l.total_days || 1
      if (l.leave_type === 'ลาป่วย') sickCount += l.total_days || 1
      else if (l.leave_type === 'ลากิจ') personalCount += l.total_days || 1
      else if (l.leave_type === 'ลาพักร้อน') annualCount += l.total_days || 1
      if (l.status === 'pending') pendingCount += 1
    })

    return {
      daysInMonth: dim,
      firstDayOfWeek: fdw,
      monthLeaves: filtered,
      dateLeavesMap: map,
      monthStats: {
        uniqueWorkers,
        totalLeaveDays,
        sickCount,
        personalCount,
        annualCount,
        pendingCount
      }
    }
  }, [calYear, calMonth, calTeamFilter, calTypeFilter, calStatusFilter, leaveRequests, employees])

  const otTeamMembers = employees.filter(e => e.team_id === otTeamId)
  const todayISO = getTodayISO()

  return (
    <div className="space-y-4">
      {/* Header & Action Buttons */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900">✅ วันลา & OT</h1>
          <p className="text-xs text-slate-500">
            {canApprove
              ? 'ตรวจสอบ, อนุมัติคำขอวันลา และดูปฏิทินวันลาภาพรวมล่วงหน้า'
              : 'ดูสถานะการอนุมัติวันลา, OT และปฏิทินวันลาภาพรวม'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLeaveModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
          >
            + แจ้งลาแทนพนักงาน
          </button>
          <button
            onClick={() => setOtModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition"
          >
            + ขอ OT รายทีม/คน
          </button>
        </div>
      </div>

      {/* 3 Subtabs: วันลา | OT | ปฏิทินวันลาภาพรวม */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setSubtab('leave')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subtab === 'leave'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏖️ รายการวันลา</span>
          {pendingLeaves.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {pendingLeaves.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubtab('ot')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subtab === 'ot'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>⏱️ รายการขอ OT</span>
          {pendingOts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {pendingOts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubtab('calendar')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subtab === 'calendar'
              ? 'bg-white text-[#0284c7] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📅 ปฏิทินวันลาภาพรวม</span>
          {monthStats.pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
              {monthStats.pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* SUBTAB 1: LEAVE REQUESTS */}
      {subtab === 'leave' && (
        <div className="space-y-4">
          {/* Top Section: Pending Leaves */}
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-900">
                ⏳ รายการที่รอการอนุมัติ ({pendingLeaves.length})
              </span>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีใบลาที่รอการอนุมัติ
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingLeaves.map(lv => (
                  <div
                    key={lv.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-extrabold">
                          {lv.leave_type}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {lv.worker_name}
                        </span>
                        <span className="text-xs text-slate-400">({lv.worker_code})</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        ช่วงวันที่:{' '}
                        <span className="font-bold text-slate-800">
                          {formatThaiDateShort(lv.start_date)} - {formatThaiDateShort(lv.end_date)}
                        </span>{' '}
                        (รวม <span className="font-bold text-[#0284c7]">{lv.total_days}</span> วัน)
                      </div>
                      <div className="text-xs text-slate-500">เหตุผล: {lv.reason || '-'}</div>
                    </div>

                    {canApprove ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => decideLeaveRequest(lv.id, 'approved')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                        >
                          ✓ อนุมัติการลา
                        </button>
                        <button
                          onClick={() => decideLeaveRequest(lv.id, 'rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                        >
                          ✕ ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                        ⏳ รออนุมัติ (สิทธิ์ Owner/HR)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section: Processed Leaves */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">
                ✓ รายการที่อนุมัติแล้ว / ประวัติ ({processedLeaves.length})
              </span>
            </div>

            {processedLeaves.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">ยังไม่มีประวัติการลา</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {processedLeaves.map(lv => (
                  <div
                    key={lv.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>{lv.worker_name}</span>
                        <span className="text-slate-500 font-normal">({lv.leave_type})</span>
                        <span className="text-slate-600">
                          {formatThaiDateShort(lv.start_date)} - {formatThaiDateShort(lv.end_date)} ({lv.total_days} วัน)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">เหตุผล: {lv.reason || '-'}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          lv.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {lv.status === 'approved' ? `✓ อนุมัติโดย ${lv.approved_by || 'ผู้บริหาร'}` : '✕ ปฏิเสธ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: OT REQUESTS */}
      {subtab === 'ot' && (
        <div className="space-y-4">
          {/* Top Section: Pending OT */}
          <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-900">
                ⏳ รายการขอ OT ที่รอการอนุมัติ ({pendingOts.length})
              </span>
            </div>

            {pendingOts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีคำขอ OT ที่รอการอนุมัติ
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingOts.map(ot => (
                  <div
                    key={ot.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-xs font-extrabold">
                          OT {ot.ot_hours || 4.5} ชม.
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {ot.worker_name}
                        </span>
                        <span className="text-xs text-slate-500">({ot.team_name})</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        📅 วันที่: <span className="font-bold">{formatThaiDateShort(ot.date_val)}</span> • ช่วงเวลา: <span className="font-semibold">{ot.hours_slot}</span>
                      </div>
                      <div className="text-xs text-slate-500">รายละเอียดงาน: {ot.work_desc}</div>
                    </div>

                    {canApprove ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => decideOtRequest(ot.id, 'approved')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                        >
                          ✓ อนุมัติ OT
                        </button>
                        <button
                          onClick={() => decideOtRequest(ot.id, 'rejected')}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                        >
                          ✕ ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold shrink-0">
                        ⏳ รออนุมัติ (สิทธิ์ Owner/HR)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Section: Approved OT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700">
                ✓ อนุมัติแล้ววันนี้ / ประวัติ OT ({processedOts.length})
              </span>
            </div>

            {processedOts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">ยังไม่มีประวัติ OT ที่อนุมัติแล้ว</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {processedOts.map(ot => (
                  <div
                    key={ot.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span>{ot.worker_name} ({ot.team_name})</span>
                        <span className="text-purple-700">{ot.hours_slot}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        วันที่ {formatThaiDateShort(ot.date_val)} • งาน: {ot.work_desc}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          ot.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ot.status === 'approved' ? `✓ อนุมัติโดย ${ot.approved_by || 'ผู้บริหาร'}` : '✕ ปฏิเสธ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: LEAVE CALENDAR (ปฏิทินวันลาภาพรวมล่วงหน้า) */}
      {subtab === 'calendar' && (
        <div className="space-y-4">
          {/* Controls: Month Nav + Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Month Switcher */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  ◀ ก่อนหน้า
                </button>
                <div className="text-sm font-extrabold text-slate-900 px-2 flex items-center gap-1.5">
                  <span className="text-[#0284c7]">📅</span>
                  <span>{THAI_MONTHS_FULL[calMonth]} {calYear + 543}</span>
                </div>
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  ถัดไป ▶
                </button>
                <button
                  onClick={handleTodayMonth}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-[#0284c7] text-xs font-bold transition border border-cyan-200 ml-1"
                >
                  เดือนปัจจุบัน
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Team Filter */}
                <select
                  value={calTeamFilter}
                  onChange={e => setCalTeamFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  <option value="all">👷 ทุกทีมช่าง / ทุกแผนก</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                {/* Leave Type Filter */}
                <select
                  value={calTypeFilter}
                  onChange={e => setCalTypeFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  <option value="all">🏖️ ทุกประเภทการลา</option>
                  <option value="ลาป่วย">🤒 ลาป่วย</option>
                  <option value="ลากิจ">🚗 ลากิจ</option>
                  <option value="ลาพักร้อน">🌴 ลาพักร้อน</option>
                </select>

                {/* Status Filter */}
                <select
                  value={calStatusFilter}
                  onChange={e => setCalStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  <option value="all">✓ อนุมัติแล้ว + ⏳ รออนุมัติ</option>
                  <option value="approved">เฉพาะที่อนุมัติแล้ว</option>
                </select>
              </div>
            </div>

            {/* Quick Stat Summary Cards for Selected Month */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500">👥 คนลาในเดือนนี้</div>
                <div className="text-lg font-extrabold text-slate-800 mt-0.5">
                  {monthStats.uniqueWorkers}{' '}
                  <span className="text-xs font-normal text-slate-400">คน</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                <div className="text-[11px] font-bold text-sky-800">🌴 ลาพักร้อน</div>
                <div className="text-lg font-extrabold text-sky-900 mt-0.5">
                  {monthStats.annualCount}{' '}
                  <span className="text-xs font-normal text-sky-600">วัน</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] font-bold text-emerald-800">🤒 ลาป่วย</div>
                <div className="text-lg font-extrabold text-emerald-900 mt-0.5">
                  {monthStats.sickCount}{' '}
                  <span className="text-xs font-normal text-emerald-600">วัน</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[11px] font-bold text-amber-800">🚗 ลากิจ</div>
                <div className="text-lg font-extrabold text-amber-900 mt-0.5">
                  {monthStats.personalCount}{' '}
                  <span className="text-xs font-normal text-amber-600">วัน</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                <div className="text-[11px] font-bold text-purple-800">⏳ รออนุมัติ</div>
                <div className="text-lg font-extrabold text-purple-900 mt-0.5">
                  {monthStats.pendingCount}{' '}
                  <span className="text-xs font-normal text-purple-600">รายการ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Calendar Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-xs font-extrabold text-slate-700">
              {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-2.5 border-r border-slate-200 last:border-r-0 ${
                    idx === 0 ? 'text-rose-600 bg-rose-50/50' : idx === 6 ? 'text-slate-800' : ''
                  }`}
                >
                  <span className="hidden sm:inline">{dayName}</span>
                  <span className="sm:hidden">{THAI_DAYS_SHORT[idx]}</span>
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200">
              {/* Blank cells for offset before day 1 */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`blank-${idx}`} className="bg-slate-50/60 min-h-[95px] sm:min-h-[115px] p-1.5" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1
                const dayOfWeek = (firstDayOfWeek + idx) % 7
                const isSunday = dayOfWeek === 0
                const isSaturday = dayOfWeek === 6
                const iso = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const isToday = iso === todayISO
                const isSelected = iso === selectedCalDate
                const dayLeaves = dateLeavesMap[iso] || []

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedCalDate(iso === selectedCalDate ? null : iso)}
                    className={`min-h-[95px] sm:min-h-[115px] p-1.5 flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-50/70 ring-2 ring-inset ring-[#0284c7]'
                        : isToday
                        ? 'bg-blue-50/40'
                        : isSunday
                        ? 'bg-rose-50/20'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Day number & leave count pill */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-[#0284c7] text-white shadow-xs'
                            : isSunday
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {day}
                      </span>

                      {dayLeaves.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                          ลา {dayLeaves.length} คน
                        </span>
                      )}
                    </div>

                    {/* Leave badges for this date */}
                    <div className="space-y-1 overflow-y-auto max-h-[80px] flex-1">
                      {dayLeaves.map(lv => {
                        const isPending = lv.status === 'pending'
                        const badgeColor =
                          lv.leave_type === 'ลาป่วย'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : lv.leave_type === 'ลากิจ'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'

                        const icon =
                          lv.leave_type === 'ลาป่วย'
                            ? '🤒'
                            : lv.leave_type === 'ลากิจ'
                            ? '🚗'
                            : '🌴'

                        return (
                          <div
                            key={lv.id}
                            onClick={e => {
                              e.stopPropagation()
                              setLeaveDetailModal(lv)
                            }}
                            title={`${lv.worker_name} (${lv.leave_type}): ${lv.reason || 'ไม่มีระบุ'}`}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border truncate transition hover:scale-[1.02] ${badgeColor} ${
                              isPending ? 'border-dashed border-amber-400' : ''
                            }`}
                          >
                            <span>{icon} {lv.worker_name}</span>
                            {isPending && <span className="ml-1 text-amber-700">⏳</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Month Leaves Table / Selected Day Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                📋 รายการลา
                {selectedCalDate
                  ? ` ประจำวันที่ ${formatThaiDateFull(selectedCalDate)} (${(dateLeavesMap[selectedCalDate] || []).length} คน)`
                  : ` ทั้งหมดในเดือน${THAI_MONTHS_FULL[calMonth]} ${calYear + 543} (${monthLeaves.length} รายการ)`}
              </span>
              {selectedCalDate && (
                <button
                  onClick={() => setSelectedCalDate(null)}
                  className="text-xs text-[#0284c7] font-bold hover:underline"
                >
                  แสดงทั้งเดือน
                </button>
              )}
            </div>

            {((selectedCalDate ? dateLeavesMap[selectedCalDate] || [] : monthLeaves)).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                ไม่มีรายการลาในช่วงเวลาที่เลือก
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(selectedCalDate ? dateLeavesMap[selectedCalDate] || [] : monthLeaves).map(lv => {
                  const emp = employees.find(e => e.id === lv.worker_id)
                  const tm = teams.find(t => t.id === emp?.team_id)
                  const isPending = lv.status === 'pending'

                  return (
                    <div
                      key={lv.id}
                      onClick={() => setLeaveDetailModal(lv)}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                              lv.leave_type === 'ลาป่วย'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lv.leave_type === 'ลากิจ'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {lv.leave_type}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{lv.worker_name}</span>
                          <span className="text-[11px] text-slate-500">
                            ({tm?.name || emp?.job_title || 'พนักงาน'})
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          ช่วงวันที่: <span className="font-bold text-slate-800">{formatThaiDateShort(lv.start_date)} - {formatThaiDateShort(lv.end_date)}</span> ({lv.total_days} วัน)
                          {lv.reason && <span className="text-slate-500 ml-2">• เหตุผล: {lv.reason}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          canApprove ? (
                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => decideLeaveRequest(lv.id, 'approved')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                              >
                                ✓ อนุมัติ
                              </button>
                              <button
                                onClick={() => decideLeaveRequest(lv.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              ⏳ รออนุมัติ
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ อนุมัติแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Leave Request */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">🏖️ บันทึกขอลาหยุด</h3>
              <button onClick={() => setLeaveModalOpen(false)} className="text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateLeave} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">พนักงานที่ขอลา</label>
                <select
                  value={lvWorkerId}
                  onChange={e => setLvWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.emp_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทการลา</label>
                <select
                  value={lvType}
                  onChange={e => setLvType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  <option value="ลาป่วย">ลาป่วย (โควตา 30 วัน/ปี)</option>
                  <option value="ลากิจ">ลากิจ (โควตา 6 วัน/ปี)</option>
                  <option value="ลาพักร้อน">ลาพักร้อน (โควตา 6 วัน/ปี)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    value={lvStart}
                    onChange={e => {
                      setLvStart(e.target.value)
                      if (e.target.value > lvEnd) setLvEnd(e.target.value)
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-[#0284c7] outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={lvEnd}
                    min={lvStart}
                    onChange={e => setLvEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-[#0284c7] outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">เหตุผลการลา</label>
                <input
                  type="text"
                  required
                  value={lvReason}
                  onChange={e => setLvReason(e.target.value)}
                  placeholder="ระบุเหตุผลการลา..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#0284c7] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                >
                  ส่งใบลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create OT Request */}
      {otModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-purple-700 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">⏱️ ขออนุมัติทำงานล่วงเวลา (OT)</h3>
              <button onClick={() => setOtModalOpen(false)} className="text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateOt} className="p-5 space-y-3.5 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลือกทีม</label>
                  <select
                    value={otTeamId}
                    onChange={e => handleChangeOtTeam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วันที่ทำ OT</label>
                  <input
                    type="date"
                    value={otDate}
                    onChange={e => setOtDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:border-[#0284c7] outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Multi-Select Worker Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    ติ๊กเลือกพนักงานที่จะทำ OT ({otCheckedWorkerIds.length}/{otTeamMembers.length} คน)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOtCheckedWorkerIds(otTeamMembers.map(w => w.id))}
                      className="text-purple-700 font-bold hover:underline"
                    >
                      เลือกทั้งทีม
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setOtCheckedWorkerIds([])}
                      className="text-slate-500 hover:underline"
                    >
                      ล้าง
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  {otTeamMembers.map(w => {
                    const checked = otCheckedWorkerIds.includes(w.id)
                    return (
                      <label
                        key={w.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          checked
                            ? 'bg-purple-50 border-purple-300 text-purple-950'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOtWorker(w.id)}
                          className="w-4 h-4 accent-purple-600 rounded"
                        />
                        <span className="truncate">{w.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Preset OT Time Slot Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ช่วงเวลา OT</label>
                <select
                  value={otSlot}
                  onChange={e => setOtSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  {OT_PRESET_SLOTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียดงานล่วงเวลา</label>
                <input
                  type="text"
                  required
                  value={otDesc}
                  onChange={e => setOtDesc(e.target.value)}
                  placeholder="เช่น เร่งประกอบคานพลิกเรือ / เดินสายตู้ไฟ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#0284c7] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOtModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
                >
                  บันทึกคำขอ OT ({otCheckedWorkerIds.length} คน)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Leave Detail Popup (from Calendar or table) */}
      {leaveDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">🏖️ รายละเอียดวันลา</h3>
                <p className="text-[11px] text-cyan-100">{leaveDetailModal.worker_name}</p>
              </div>
              <button
                onClick={() => setLeaveDetailModal(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{leaveDetailModal.worker_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {employees.find(e => e.id === leaveDetailModal.worker_id)?.job_title || 'พนักงาน'}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    leaveDetailModal.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : leaveDetailModal.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {leaveDetailModal.status === 'approved'
                    ? '✓ อนุมัติแล้ว'
                    : leaveDetailModal.status === 'rejected'
                    ? '✕ ปฏิเสธ'
                    : '⏳ รออนุมัติ'}
                </span>
              </div>

              <div className="space-y-2 text-slate-700">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ประเภทการลา:</span>
                  <span className="font-bold text-slate-900">{leaveDetailModal.leave_type}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">ช่วงวันที่ลา:</span>
                  <span className="font-bold text-slate-900">
                    {formatThaiDateShort(leaveDetailModal.start_date)} - {formatThaiDateShort(leaveDetailModal.end_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">จำนวนวันลา:</span>
                  <span className="font-bold text-[#0284c7]">{leaveDetailModal.total_days} วัน</span>
                </div>
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 block mb-0.5">เหตุผลการลา:</span>
                  <span className="font-medium text-slate-900">{leaveDetailModal.reason || '-'}</span>
                </div>
                {leaveDetailModal.approved_by && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">ผู้อนุมัติ:</span>
                    <span className="font-bold text-slate-900">{leaveDetailModal.approved_by}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {canApprove && leaveDetailModal.status === 'pending' ? (
                  <>
                    <button
                      onClick={async () => {
                        await decideLeaveRequest(leaveDetailModal.id, 'rejected')
                        setLeaveDetailModal(null)
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition"
                    >
                      ✕ ปฏิเสธ
                    </button>
                    <button
                      onClick={async () => {
                        await decideLeaveRequest(leaveDetailModal.id, 'approved')
                        setLeaveDetailModal(null)
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                    >
                      ✓ อนุมัติการลา
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setLeaveDetailModal(null)}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                  >
                    ปิด
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
