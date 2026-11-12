import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { getCutOffStatus, getTodayISO, formatThaiDateShort } from '../lib/dateUtils'
import { OT_PRESET_SLOTS } from './ApprovalsPage'

export default function SelfServicePage() {
  const { activeUser, effectiveRole, devSimTimeMode } = useAuth()
  const {
    employees,
    teams,
    leaveRequests,
    otRequests,
    submitLeaveRequest,
    submitOtRequests
  } = useApp()

  const [formTab, setFormTab] = useState('leave') // 'leave' | 'ot'

  // Leave form state (NO time restriction - available 24/7)
  const [leaveType, setLeaveType] = useState('ลากิจ')
  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())
  const [reason, setReason] = useState('')

  // OT form state (Subject to before 17:00 cut-off)
  const [otDate, setOtDate] = useState(getTodayISO())
  const [otSlot, setOtSlot] = useState(OT_PRESET_SLOTS[0].value)
  const [otDesc, setOtDesc] = useState('')
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState(() =>
    activeUser?.id ? [activeUser.id] : []
  )

  const cutOff = getCutOffStatus(devSimTimeMode)
  const canBypassCutOff = ['owner', 'hr', 'clerk'].includes(effectiveRole)
  // Strict before-17:00 rule applies ONLY to OT submissions!
  const isOtLocked = !cutOff.isBefore17 && !canBypassCutOff

  // Calculate live leave quota for activeUser
  const myApprovedLeaves = useMemo(() => {
    return leaveRequests.filter(
      l => l.worker_id === activeUser?.id && l.status === 'approved'
    )
  }, [leaveRequests, activeUser])

  const usedSick = myApprovedLeaves
    .filter(l => l.leave_type === 'ลาป่วย')
    .reduce((acc, r) => acc + (Number(r.total_days) || 1), 0)
  const usedPersonal = myApprovedLeaves
    .filter(l => l.leave_type === 'ลากิจ')
    .reduce((acc, r) => acc + (Number(r.total_days) || 1), 0)
  const usedAnnual = myApprovedLeaves
    .filter(l => l.leave_type === 'ลาพักร้อน')
    .reduce((acc, r) => acc + (Number(r.total_days) || 1), 0)

  const quotaSick = activeUser?.quota_sick ?? 30
  const quotaPersonal = activeUser?.quota_personal ?? 6
  const quotaAnnual = activeUser?.quota_annual ?? 6

  // Team members for Team Lead OT multi-select
  const myTeamMembers = useMemo(() => {
    if (!activeUser?.team_id) return activeUser ? [activeUser] : []
    return employees.filter(e => e.team_id === activeUser.team_id)
  }, [employees, activeUser])

  const myRecentLeaves = leaveRequests.filter(l => l.worker_id === activeUser?.id)
  const myRecentOts = otRequests.filter(o => o.worker_id === activeUser?.id)

  function toggleMemberForOt(wid) {
    setSelectedTeamMemberIds(prev =>
      prev.includes(wid) ? prev.filter(id => id !== wid) : [...prev, wid]
    )
  }

  async function handleLeaveSubmit(e) {
    e.preventDefault()
    // Leave submission is never locked by time
    const d1 = new Date(startDate)
    const d2 = new Date(endDate)
    const totalDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1)

    const ok = await submitLeaveRequest({
      workerId: activeUser?.id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason
    })
    if (ok) setReason('')
  }

  async function handleOtSubmit(e) {
    e.preventDefault()
    if (isOtLocked) return
    const targetIds = effectiveRole === 'lead' && selectedTeamMemberIds.length > 0
      ? selectedTeamMemberIds
      : [activeUser?.id]

    const foundSlot = OT_PRESET_SLOTS.find(s => s.value === otSlot) || OT_PRESET_SLOTS[0]
    const ok = await submitOtRequests({
      workerIds: targetIds,
      dateVal: otDate,
      hoursSlot: foundSlot.value,
      otHours: foundSlot.hours,
      workDesc: otDesc
    })
    if (ok) setOtDesc('')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header & Status Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>ยื่นใบลา / ขอทำ OT</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ผู้ยื่นคำขอ: <span className="font-bold text-slate-800">{activeUser?.name}</span> ({activeUser?.emp_code})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            ลาหยุด: ยื่นได้ 24 ชม.
          </span>
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              cutOff.isBefore17
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>ขอ OT ก่อน 17:00 น.</span>
          </span>
        </div>
      </div>

      {/* 3 Live Leave Quota Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">ลาป่วยคงเหลือ</div>
          <div className="text-xl font-extrabold text-cyan-700 mt-1">
            {Math.max(0, quotaSick - usedSick)}{' '}
            <span className="text-xs font-semibold text-slate-400">/ {quotaSick} วัน</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ใช้ไปแล้ว {usedSick} วัน</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">ลากิจคงเหลือ</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">
            {Math.max(0, quotaPersonal - usedPersonal)}{' '}
            <span className="text-xs font-semibold text-slate-400">/ {quotaPersonal} วัน</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ใช้ไปแล้ว {usedPersonal} วัน</div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">พักร้อนคงเหลือ</div>
          <div className="text-xl font-extrabold text-teal-700 mt-1">
            {Math.max(0, quotaAnnual - usedAnnual)}{' '}
            <span className="text-xs font-semibold text-slate-400">/ {quotaAnnual} วัน</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ใช้ไปแล้ว {usedAnnual} วัน</div>
        </div>
      </div>

      {/* Form Switcher */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setFormTab('leave')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            formTab === 'leave'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>แบบฟอร์มขอลาหยุด (ยื่นได้ตลอด)</span>
        </button>
        <button
          onClick={() => setFormTab('ot')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            formTab === 'ot'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>แบบฟอร์มขอทำ OT (ก่อน 17:00 น.)</span>
        </button>
      </div>

      {/* Warning if OT is locked after 17:00 (shown ONLY on OT tab, without developer hint) */}
      {formTab === 'ot' && isOtLocked && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <span>🔒</span>
          <span>
            ขณะนี้เลยเวลา 17:00 น. แล้ว ระบบปิดรับคำขอทำ OT สำหรับวันนี้ กรุณาติดต่อเสมียนสาขาหรือฝ่ายบุคคล
          </span>
        </div>
      )}

      {/* FORM 1: Leave Request (No time lock, No approver dropdown) */}
      {formTab === 'leave' && (
        <form
          onSubmit={handleLeaveSubmit}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">🏖️ กรอกรายละเอียดการลาหยุด</h2>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              ✓ ยื่นได้ตลอดเวลา
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทการลา</label>
            <select
              value={leaveType}
              onChange={e => setLeaveType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ลากิจ">ลากิจ (เหลือ {Math.max(0, quotaPersonal - usedPersonal)} วัน)</option>
              <option value="ลาป่วย">ลาป่วย (เหลือ {Math.max(0, quotaSick - usedSick)} วัน)</option>
              <option value="ลาพักร้อน">ลาพักร้อน (เหลือ {Math.max(0, quotaAnnual - usedAnnual)} วัน)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ตั้งแต่วันที่</label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) setEndDate(e.target.value)
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ถึงวันที่</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">เหตุผลการลา</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="ระบุเหตุผลการลา..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white text-xs font-bold shadow-md hover:opacity-95 transition"
          >
            ส่งคำขอลาหยุด
          </button>
        </form>
      )}

      {/* FORM 2: OT Request (Subject to before-17:00 cut-off) */}
      {formTab === 'ot' && (
        <form
          onSubmit={handleOtSubmit}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">⏱️ ขออนุมัติทำงานล่วงเวลา (OT)</h2>
            <span className="text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
              ก่อน 17:00 น.
            </span>
          </div>

          {effectiveRole === 'lead' && myTeamMembers.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  เลือกสมาชิกในทีมที่จะขอ OT ({selectedTeamMemberIds.length}/{myTeamMembers.length} คน)
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedTeamMemberIds(myTeamMembers.map(m => m.id))}
                  className="text-[11px] font-bold text-purple-700 hover:underline"
                >
                  เลือกทั้งทีม
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                {myTeamMembers.map(m => {
                  const checked = selectedTeamMemberIds.includes(m.id)
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        checked
                          ? 'bg-purple-50 border-purple-300 text-purple-950'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMemberForOt(m.id)}
                        className="w-4 h-4 accent-purple-600 rounded"
                      />
                      <span className="truncate">{m.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">วันที่ทำ OT</label>
              <input
                type="date"
                value={otDate}
                onChange={e => setOtDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ช่วงเวลา OT</label>
              <select
                value={otSlot}
                onChange={e => setOtSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {OT_PRESET_SLOTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">รายละเอียดงานที่ทำล่วงเวลา</label>
            <textarea
              rows={2}
              required
              value={otDesc}
              onChange={e => setOtDesc(e.target.value)}
              placeholder="ระบุงานที่ต้องเร่งทำล่วงเวลา..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isOtLocked}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition disabled:opacity-40"
          >
            ส่งคำขอทำ OT
          </button>
        </form>
      )}

      {/* My Submitted Requests Status List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-800">📌 สถานะคำขอของฉัน</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {myRecentLeaves.length === 0 && myRecentOts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">ยังไม่มีรายการคำขอของคุณ</div>
          ) : (
            <>
              {myRecentLeaves.map(lv => (
                <div key={`mylv-${lv.id}`} className="p-3.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-cyan-800">[ใบลา] {lv.leave_type}</span> •{' '}
                    <span className="font-semibold text-slate-800">{formatThaiDateShort(lv.start_date)}</span> ({lv.total_days} วัน)
                    <div className="text-[11px] text-slate-500">เหตุผล: {lv.reason}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      lv.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lv.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {lv.status === 'approved' ? '✓ อนุมัติแล้ว' : lv.status === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'}
                  </span>
                </div>
              ))}
              {myRecentOts.map(ot => (
                <div key={`myot-${ot.id}`} className="p-3.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-purple-700">[OT] {ot.hours_slot}</span> •{' '}
                    <span className="font-semibold text-slate-800">{formatThaiDateShort(ot.date_val)}</span>
                    <div className="text-[11px] text-slate-500">งาน: {ot.work_desc}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      ot.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ot.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ot.status === 'approved' ? '✓ อนุมัติแล้ว' : ot.status === 'rejected' ? '✕ ไม่อนุมัติ' : '⏳ รออนุมัติ'}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
