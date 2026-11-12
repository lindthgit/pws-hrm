import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { formatThaiDateFull, getTaskColorClasses, getTodayISO } from '../lib/dateUtils'

export default function WorkOrderTimePage() {
  const { activeUser, effectiveRole } = useAuth()
  const {
    selectedDate,
    setSelectedDate,
    officeSites,
    teams,
    employees,
    vehicles,
    dailyDispatches,
    getWorkerScheduleForDate,
    getWorkerLeaveOnDate,
    getAttendanceSummaryForDate,
    updateVehicleStatus,
    saveWorkerPunch,
    markBatchPresent,
    confirmDailyDispatch
  } = useApp()

  const [subtab, setSubtab] = useState('workorders') // 'workorders' | 'time'
  const [siteFilter, setSiteFilter] = useState(() => {
    if (effectiveRole === 'clerk' && activeUser?.office_site_id) {
      return activeUser.office_site_id
    }
    return 'all'
  })

  // Confirm Modal state: { team, taskDesc, vehicleId, isConfirmed, remark }
  const [confirmModal, setConfirmModal] = useState(null)
  const [modalRemark, setModalRemark] = useState('')
  const [savingConfirm, setSavingConfirm] = useState(false)

  // Local draft time inputs keyed by `${date}_${workerId}`
  const [timeDrafts, setTimeDrafts] = useState({})

  // Permissions per user spec:
  // Subtab "ใบงาน": Owner/HR/Lead = ดู, Clerk = เปลี่ยนสถานะรถ ("ใช้งาน" / "คืนรถ") & คอนเฟิร์มใบงาน
  const canChangeVehicleOnWorkOrder = effectiveRole === 'clerk' || effectiveRole === 'owner'
  const canConfirmWorkOrder = effectiveRole === 'clerk' || effectiveRole === 'owner'
  // Subtab "ลงเวลา": Owner/Lead = ดู, Clerk/HR = ลงเวลาได้
  const canRecordTime = effectiveRole === 'clerk' || effectiveRole === 'hr'

  const attendanceSummary = getAttendanceSummaryForDate(selectedDate, siteFilter)
  const filteredWorkers = siteFilter === 'all'
    ? employees
    : employees.filter(e => e.office_site_id === siteFilter)

  const visibleTeams = (siteFilter === 'all'
    ? teams
    : teams.filter(t => t.office_site_id === siteFilter)
  ).slice().sort((a, b) => {
    if (effectiveRole === 'lead' && activeUser?.team_id) {
      if (a.id === activeUser.team_id) return -1
      if (b.id === activeUser.team_id) return 1
    }
    return (a.sort_order || 0) - (b.sort_order || 0)
  })

  function getDraftTime(workerId, field, fallbackVal) {
    const key = `${selectedDate}_${workerId}_${field}`
    if (timeDrafts[key] !== undefined) return timeDrafts[key]
    return fallbackVal || ''
  }

  function setDraftTime(workerId, field, val) {
    const key = `${selectedDate}_${workerId}_${field}`
    setTimeDrafts(prev => ({ ...prev, [key]: val }))
  }

  async function handleSaveInTime(worker) {
    const existing = attendanceSummary.punchesMap[worker.id]
    const inVal = getDraftTime(worker.id, 'in', existing?.punch_in || '07:45') || '07:45'
    await saveWorkerPunch({
      dateVal: selectedDate,
      workerId: worker.id,
      officeSiteId: worker.office_site_id,
      status: 'present',
      punchIn: inVal,
      toastLabel: `บันทึกเวลาเข้างาน ${worker.name} (${inVal} น.) แล้ว`
    })
  }

  async function handleSaveOutTime(worker) {
    const existing = attendanceSummary.punchesMap[worker.id]
    const outVal = getDraftTime(worker.id, 'out', existing?.punch_out || '17:00') || '17:00'
    await saveWorkerPunch({
      dateVal: selectedDate,
      workerId: worker.id,
      officeSiteId: worker.office_site_id,
      status: existing?.status || 'present',
      punchOut: outVal,
      toastLabel: `บันทึกเวลาออกงาน ${worker.name} (${outVal} น.) แล้ว`
    })
  }

  async function handleSetWorkerStatus(worker, newStatus) {
    await saveWorkerPunch({
      dateVal: selectedDate,
      workerId: worker.id,
      officeSiteId: worker.office_site_id,
      status: newStatus,
      punchIn: newStatus === 'present' ? '07:45' : null,
      punchOut: null,
      toastLabel: `อัปเดตสถานะ ${worker.name} เรียบร้อย`
    })
  }

  function openConfirmModal(team, grp, existingDispatch) {
    setConfirmModal({
      team,
      taskDesc: grp.taskDesc,
      vehicleId: grp.vehicleId,
      isConfirmed: Boolean(existingDispatch?.confirmed)
    })
    setModalRemark(existingDispatch?.remark || '')
  }

  async function handleConfirmSubmit(e) {
    e.preventDefault()
    if (!confirmModal) return
    setSavingConfirm(true)
    const ok = await confirmDailyDispatch({
      dateVal: selectedDate,
      teamId: confirmModal.team.id,
      taskDesc: confirmModal.taskDesc,
      vehicleId: confirmModal.vehicleId,
      confirmed: true,
      remark: modalRemark,
      status: 'in_use'
    })
    setSavingConfirm(false)
    if (ok) setConfirmModal(null)
  }

  async function handleUnconfirm() {
    if (!confirmModal) return
    setSavingConfirm(true)
    const ok = await confirmDailyDispatch({
      dateVal: selectedDate,
      teamId: confirmModal.team.id,
      taskDesc: confirmModal.taskDesc,
      vehicleId: confirmModal.vehicleId,
      confirmed: false,
      remark: '',
      status: 'pending'
    })
    setSavingConfirm(false)
    if (ok) setConfirmModal(null)
  }

  return (
    <div className="space-y-4">
      {/* Top Bar: Title, Branch Selector, Date Picker */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="m9 14 2 2 4-4" />
            </svg>
            <span>ใบงาน/ลงเวลา</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{formatThaiDateFull(selectedDate)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Office Site Filter */}
          <select
            value={siteFilter}
            onChange={e => setSiteFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">ทุกสาขา ({employees.length} คน)</option>
            {officeSites.map(s => (
              <option key={s.id} value={s.id}>
                สาขา{s.name} (เสมียน: {s.clerk_name})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <button
            onClick={() => setSelectedDate(getTodayISO())}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            วันนี้
          </button>
        </div>
      </div>

      {/* 2 Subtabs: "ใบงาน" | "ลงเวลา" */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setSubtab('workorders')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subtab === 'workorders'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="m9 14 2 2 4-4" />
          </svg>
          <span>ใบงาน</span>
        </button>
        <button
          onClick={() => setSubtab('time')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            subtab === 'time'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>ลงเวลา</span>
        </button>
      </div>

      {/* SUBTAB 1: ใบงาน */}
      {subtab === 'workorders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleTeams.map(team => {
            const teamWorkers = employees.filter(e => e.team_id === team.id)
            const taskGroups = {}

            teamWorkers.forEach(w => {
              const { taskDesc, vehicleId } = getWorkerScheduleForDate(w, selectedDate)
              const key = taskDesc || '__NONE__'
              if (!taskGroups[key]) {
                taskGroups[key] = {
                  taskDesc: taskDesc || 'ประจำสาขา / รอใบงาน',
                  vehicleId: vehicleId || team.default_car_id,
                  workers: []
                }
              }
              taskGroups[key].workers.push(w)
            })

            const isMyLeadTeam = effectiveRole === 'lead' && activeUser?.team_id === team.id

            return (
              <div
                key={team.id}
                className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col transition ${
                  isMyLeadTeam
                    ? 'border-[#0284c7] ring-2 ring-[#0284c7]/40 shadow-md'
                    : 'border-slate-200'
                }`}
              >
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  isMyLeadTeam
                    ? 'bg-gradient-to-r from-sky-100/90 via-cyan-50 to-white border-cyan-200'
                    : 'bg-gradient-to-r from-sky-50 via-cyan-50/60 to-slate-50 border-cyan-100'
                }`}>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isMyLeadTeam ? 'bg-[#0284c7] ring-2 ring-sky-300' : 'bg-[#0284c7]'}`}></span>
                    {team.name}
                    {isMyLeadTeam && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#0284c7] text-white shadow-xs ml-1">
                        ⭐ ทีมของคุณ
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-[#0369a1] bg-white px-2 py-0.5 rounded-lg border border-cyan-200 flex items-center gap-1">
                    <svg className="w-3 h-3 text-[#0369a1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{team.site || 'ประจำออฟฟิศ'}</span>
                  </span>
                </div>

                <div className="p-3 space-y-2.5 flex-1">
                  {Object.values(taskGroups).map((grp, idx) => {
                    const colors = getTaskColorClasses(grp.taskDesc === 'ประจำสาขา / รอใบงาน' ? '' : grp.taskDesc)
                    const car = vehicles.find(v => v.id === grp.vehicleId)

                    // Find clerk confirmation from dailyDispatches
                    const dispatch = dailyDispatches.find(
                      d => d.date_val === selectedDate && d.team_id === team.id && d.task_desc === grp.taskDesc
                    )
                    const isConfirmed = Boolean(dispatch?.confirmed)

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${colors.bg} ${colors.border} space-y-2.5`}
                      >
                        <div className={`text-xs font-bold ${colors.text}`}>{grp.taskDesc}</div>

                        {/* Workers in this task */}
                        <div className="flex flex-wrap gap-1">
                          {grp.workers.map(w => {
                            const lv = getWorkerLeaveOnDate(w.id, selectedDate)
                            return (
                              <span
                                key={w.id}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                                  lv
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 line-through'
                                    : 'bg-white text-slate-700 border-slate-200'
                                }`}
                              >
                                {w.name} {lv ? `(ลา)` : ''}
                              </span>
                            )
                          })}
                        </div>

                        {/* Vehicle Action Row inside Work Order */}
                        {car && (
                          <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="3" width="15" height="13" rx="1" />
                                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                  <circle cx="5.5" cy="18.5" r="2.5" />
                                  <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                                <span>{car.name} ({car.plate})</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                สถานะ:{' '}
                                <span className="font-bold text-slate-700">
                                  {car.status === 'available'
                                    ? 'ว่าง'
                                    : car.status === 'in_use'
                                    ? 'ใช้งาน'
                                    : 'ซ่อม'}
                                </span>
                              </div>
                            </div>

                            {canChangeVehicleOnWorkOrder ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                {car.status !== 'in_use' ? (
                                  <button
                                    onClick={() =>
                                      updateVehicleStatus({
                                        vehicleId: car.id,
                                        newStatus: 'in_use',
                                        driverName: team.lead,
                                        destText: grp.taskDesc
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold shadow-xs transition"
                                  >
                                    ใช้งาน
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      updateVehicleStatus({
                                        vehicleId: car.id,
                                        newStatus: 'available',
                                        destText: 'ประจำออฟฟิศ'
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                                  >
                                    คืนรถ
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                  car.status === 'available'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : car.status === 'in_use'
                                    ? 'bg-cyan-100 text-cyan-900'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {car.status === 'available'
                                  ? 'ว่าง'
                                  : car.status === 'in_use'
                                  ? 'ใช้งาน'
                                  : 'ซ่อม'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Clerk Confirmation Row per user requirement */}
                        {grp.taskDesc !== 'ประจำสาขา / รอใบงาน' && (
                          <div className="pt-2 border-t border-black/5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              {isConfirmed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                                  <span>✓ เสมียนคอนเฟิร์มแล้ว</span>
                                  <span>({dispatch.clerk_name || 'เสมียน'} {dispatch.confirmed_time || ''})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                                  <span>⏳ รอเสมียนคอนเฟิร์ม</span>
                                </span>
                              )}

                              {canConfirmWorkOrder && (
                                <button
                                  onClick={() => openConfirmModal(team, grp, dispatch)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold shadow-xs transition ${
                                    isConfirmed
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                      : 'bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white hover:opacity-95'
                                  }`}
                                >
                                  {isConfirmed ? '✏️ แก้ไขข้อความ' : '📝 คอนเฟิร์มใบงาน'}
                                </button>
                              )}
                            </div>

                            {isConfirmed && dispatch.remark && (
                              <div className="text-[11px] text-emerald-950 bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200 font-medium">
                                <span className="font-bold">💬 ข้อความเสมียน:</span> {dispatch.remark}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* SUBTAB 2: ลงเวลา (2-Column Desktop Grid & Independent Punch-In / Punch-Out Save) */}
      {subtab === 'time' && (
        <div className="space-y-3">
          {/* Quick Batch Bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-slate-800">
              รายชื่อพนักงาน ({filteredWorkers.length} คน) •{' '}
              <span className="text-emerald-700">
                มา {attendanceSummary.isCounted ? attendanceSummary.presentCount : '--'}
              </span>{' '}
              • <span className="text-amber-700">ลา {attendanceSummary.leaveCount}</span> •{' '}
              <span className="text-rose-700">
                ขาด {attendanceSummary.isCounted ? attendanceSummary.absentCount : '--'}
              </span>
            </div>

            {canRecordTime && (
              <button
                onClick={() => markBatchPresent(selectedDate, filteredWorkers)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                ✓ เช็คชื่อมาครบ (07:45)
              </button>
            )}
          </div>

          {/* 2-Column Grid on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {filteredWorkers.map(worker => {
              const team = teams.find(t => t.id === worker.team_id)
              const punch = attendanceSummary.punchesMap[worker.id]
              const approvedLeave = getWorkerLeaveOnDate(worker.id, selectedDate)
              const status = approvedLeave ? 'leave' : (punch?.status || 'uncounted')

              const inVal = getDraftTime(worker.id, 'in', punch?.punch_in || '07:45')
              const outVal = getDraftTime(worker.id, 'out', punch?.punch_out || '')

              return (
                <div
                  key={worker.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  {/* Left: Worker Info & Status Pill */}
                  <div className="min-w-0 flex items-center justify-between sm:block">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{worker.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({worker.emp_code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {team ? team.name : worker.job_title}
                      </div>
                    </div>

                    {canRecordTime && !approvedLeave && (
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => handleSetWorkerStatus(worker, 'present')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                          }`}
                        >
                          มา
                        </button>
                        <button
                          onClick={() => handleSetWorkerStatus(worker, 'absent')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                          }`}
                        >
                          ขาด
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Independent Punch-In and Punch-Out Controls */}
                  {approvedLeave ? (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shrink-0">
                      🏖️ {approvedLeave.leave_type} ({approvedLeave.reason})
                    </div>
                  ) : canRecordTime ? (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Independent Punch In */}
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                        <span className="text-[10px] font-bold text-slate-500 pl-1">เข้า:</span>
                        <input
                          type="time"
                          value={inVal}
                          onChange={e => setDraftTime(worker.id, 'in', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-slate-800 w-[78px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInTime(worker)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            punch?.punch_in
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-cyan-700 text-white hover:bg-cyan-800'
                          }`}
                        >
                          {punch?.punch_in ? '✓ เข้า' : 'บันทึกเข้า'}
                        </button>
                      </div>

                      {/* Independent Punch Out */}
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                        <span className="text-[10px] font-bold text-slate-500 pl-1">ออก:</span>
                        <input
                          type="time"
                          value={outVal}
                          onChange={e => setDraftTime(worker.id, 'out', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-slate-800 w-[78px]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveOutTime(worker)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            punch?.punch_out
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-800 text-white hover:bg-slate-700'
                          }`}
                        >
                          {punch?.punch_out ? '✓ ออก' : 'บันทึกออก'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View-Only for Owner / Lead */
                    <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        เข้า: {punch?.punch_in || '--:--'}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        ออก: {punch?.punch_out || '--:--'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CLERK CONFIRM WORK ORDER MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">📋 คอนเฟิร์มใบงาน — {confirmModal.team.name}</h3>
                <p className="text-[11px] text-cyan-100">{formatThaiDateFull(selectedDate)}</p>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="text-slate-500 font-semibold">ใบงาน:</div>
                <div className="font-bold text-slate-900">{confirmModal.taskDesc}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ข้อความ / หมายเหตุจากเสมียน
                </label>
                <textarea
                  rows={3}
                  value={modalRemark}
                  onChange={e => setModalRemark(e.target.value)}
                  placeholder="เช่น ช่างออกเดินทางแล้ว 08:30 น. / เบิกเครื่องมือตรวจรับครบถ้วน / เตรียมของขึ้นรถเรียบร้อย..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {confirmModal.isConfirmed ? (
                  <button
                    type="button"
                    onClick={handleUnconfirm}
                    disabled={savingConfirm}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                  >
                    ✕ ยกเลิกคอนเฟิร์ม
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    ปิด
                  </button>
                  <button
                    type="submit"
                    disabled={savingConfirm}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white text-xs font-bold shadow-md hover:opacity-95 transition disabled:opacity-50"
                  >
                    {savingConfirm ? 'กำลังบันทึก...' : '✓ ยืนยันคอนเฟิร์มใบงาน'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
