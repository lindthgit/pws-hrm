import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  THAI_MONTHS_FULL,
  THAI_MONTHS_SHORT,
  getDaysInMonth,
  getDayMeta,
  getTaskColorClasses,
  formatThaiDateFull
} from '../lib/dateUtils'

export default function PlannerPage() {
  const {
    selectedDate,
    setSelectedDate,
    plannerYM,
    setPlannerYM,
    teams,
    employees,
    vehicles,
    customerSites,
    planRevisions,
    getWorkerScheduleForDate,
    getWorkerLeaveOnDate,
    savePlannerAssignments,
    createPlanRevision,
    showToast
  } = useApp()

  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all')
  const [editModal, setEditModal] = useState(null) // { team, dateIso, checkedWorkerIds, taskDesc, vehicleId }
  const [lineModalOpen, setLineModalOpen] = useState(false)
  const [lineSummaryDate, setLineSummaryDate] = useState(selectedDate)
  const [revModalOpen, setRevModalOpen] = useState(false)
  const [revNote, setRevNote] = useState('')
  const [saving, setSaving] = useState(false)

  const { year, month } = plannerYM
  const totalDays = getDaysInMonth(year, month)

  const daysArray = useMemo(() => {
    const arr = []
    for (let d = 1; d <= totalDays; d++) {
      arr.push({
        day: d,
        ...getDayMeta(year, month, d)
      })
    }
    return arr
  }, [year, month, totalDays])

  const filteredTeams = useMemo(() => {
    if (selectedTeamFilter === 'all') return teams
    return teams.filter(t => t.id === selectedTeamFilter)
  }, [teams, selectedTeamFilter])

  const monthRevisions = useMemo(() => {
    return planRevisions.filter(r => r.year_val === year && r.month_val === month)
  }, [planRevisions, year, month])

  const latestRevision = monthRevisions[monthRevisions.length - 1]

  function handleMonthInputChange(e) {
    const val = e.target.value // YYYY-MM
    if (!val) return
    const [yStr, mStr] = val.split('-')
    const y = parseInt(yStr, 10)
    const m = parseInt(mStr, 10)
    setPlannerYM({ year: y, month: m })
  }

  function openAssignModal(team, dateIso, clickedWorkerId = null) {
    const teamWorkers = employees.filter(e => e.team_id === team.id)
    const allIds = teamWorkers.map(w => w.id)

    let initialTask = ''
    let initialVeh = team.default_car_id || 'v1'
    let initialChecked = allIds

    if (clickedWorkerId) {
      const clickedWorker = teamWorkers.find(w => w.id === clickedWorkerId)
      const resolved = getWorkerScheduleForDate(clickedWorker, dateIso)
      initialTask = resolved.taskDesc || ''
      initialVeh = resolved.vehicleId || team.default_car_id || 'v1'

      if (resolved.taskDesc) {
        // Pre-check all team members who currently share this exact task on dateIso
        const matchingIds = teamWorkers
          .filter(w => getWorkerScheduleForDate(w, dateIso).taskDesc === resolved.taskDesc)
          .map(w => w.id)
        if (matchingIds.length > 0) {
          initialChecked = matchingIds
        }
      }
    } else {
      // Clicked team header row
      const firstWorker = teamWorkers[0]
      if (firstWorker) {
        const resolved = getWorkerScheduleForDate(firstWorker, dateIso)
        initialTask = resolved.taskDesc || ''
        initialVeh = resolved.vehicleId || team.default_car_id || 'v1'
      }
    }

    setEditModal({
      team,
      teamWorkers,
      dateIso,
      checkedWorkerIds: initialChecked,
      taskDesc: initialTask,
      vehicleId: initialVeh
    })
  }

  function toggleWorkerCheckbox(wid) {
    if (!editModal) return
    const exists = editModal.checkedWorkerIds.includes(wid)
    const next = exists
      ? editModal.checkedWorkerIds.filter(id => id !== wid)
      : [...editModal.checkedWorkerIds, wid]
    setEditModal({ ...editModal, checkedWorkerIds: next })
  }

  async function handleSaveAssignment(e) {
    e.preventDefault()
    if (!editModal) return
    if (editModal.checkedWorkerIds.length === 0) {
      showToast('กรุณาติ๊กเลือกสมาชิกในทีมอย่างน้อย 1 คน', 'error')
      return
    }
    setSaving(true)
    const ok = await savePlannerAssignments({
      dateVal: editModal.dateIso,
      teamId: editModal.team.id,
      selectedWorkerIds: editModal.checkedWorkerIds,
      allTeamWorkerIds: editModal.teamWorkers.map(w => w.id),
      taskDesc: editModal.taskDesc,
      vehicleId: editModal.vehicleId
    })
    setSaving(false)
    if (ok) setEditModal(null)
  }

  async function handleClearAssignment() {
    if (!editModal) return
    setSaving(true)
    const ok = await savePlannerAssignments({
      dateVal: editModal.dateIso,
      teamId: editModal.team.id,
      selectedWorkerIds: editModal.checkedWorkerIds,
      allTeamWorkerIds: editModal.teamWorkers.map(w => w.id),
      taskDesc: '',
      vehicleId: null
    })
    setSaving(false)
    if (ok) setEditModal(null)
  }

  async function handleSaveRevision(e) {
    e.preventDefault()
    setSaving(true)
    const ok = await createPlanRevision(year, month, revNote)
    setSaving(false)
    if (ok) {
      setRevNote('')
      setRevModalOpen(false)
    }
  }

  // Generate full LINE text for lineSummaryDate
  const lineSummaryText = useMemo(() => {
    const lines = [
      `📢 สรุปใบงานและแผนจัดส่งทีมงาน PWS`,
      `📅 ${formatThaiDateFull(lineSummaryDate)}`,
      `━━━━━━━━━━━━━━━━━━━━`
    ]

    teams.forEach((team, idx) => {
      const teamWorkers = employees.filter(e => e.team_id === team.id)
      const groups = {}
      const leaveNames = []

      teamWorkers.forEach(w => {
        const lv = getWorkerLeaveOnDate(w.id, lineSummaryDate)
        if (lv) {
          leaveNames.push(`${w.name} (${lv.leave_type})`)
        }
        const { taskDesc, vehicleId } = getWorkerScheduleForDate(w, lineSummaryDate)
        const key = taskDesc || '__NONE__'
        if (!groups[key]) {
          groups[key] = {
            taskDesc: taskDesc || 'รอสั่งงาน / ประจำสาขา',
            vehicleId: vehicleId || team.default_car_id,
            workerNames: []
          }
        }
        groups[key].workerNames.push(w.name)
      })

      lines.push(`\n${idx + 1}. 👷 ${team.name} (รวม ${teamWorkers.length} คน)`)
      Object.values(groups).forEach(g => {
        const car = vehicles.find(v => v.id === g.vehicleId)
        const carTxt = car ? `🚛 ${car.name} (${car.plate})` : '🚛 -'
        lines.push(`   • ใบงาน: ${g.taskDesc}`)
        lines.push(`   • สมาชิก (${g.workerNames.length}): ${g.workerNames.join(', ')}`)
        lines.push(`   • รถที่ใช้: ${carTxt}`)
      })
      if (leaveNames.length > 0) {
        lines.push(`   ⚠️ ลาวันนี้: ${leaveNames.join(', ')}`)
      }
    })

    lines.push(`\n━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`✅ อัปเดตจากระบบ PWS Cloud (${latestRevision ? latestRevision.version_code : 'v1'})`)
    return lines.join('\n')
  }, [lineSummaryDate, teams, employees, vehicles, getWorkerScheduleForDate, getWorkerLeaveOnDate, latestRevision])

  return (
    <div className="flex flex-col space-y-2.5">
      {/* Compact Single-Row Control Header (Maximizes vertical space for Gantt matrix) */}
      <div className="bg-white rounded-2xl px-3.5 py-2.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        {/* Left: Month Picker + Team Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
            <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-bold text-slate-700">เดือน:</span>
            <input
              type="month"
              value={`${year}-${String(month).padStart(2, '0')}`}
              onChange={handleMonthInputChange}
              className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none"
            />
          </div>

          {/* Compact Team Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedTeamFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedTeamFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทุกทีม ({teams.length})
            </button>
            {teams.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeamFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  selectedTeamFilter === t.id
                    ? 'bg-[#0284c7] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Revision Button + LINE Summary Button */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRevModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition border border-slate-200"
          >
            <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>บันทึกแผน ({latestRevision ? latestRevision.version_code : 'v1'})</span>
          </button>

          <button
            onClick={() => {
              setLineSummaryDate(selectedDate)
              setLineModalOpen(true)
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>ส่ง LINE</span>
          </button>
        </div>
      </div>

      {/* Scrollable Matrix Container with Sticky Column (Left) & Sticky Header Row (Top) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden flex-1">
        <div className="overflow-auto max-h-[calc(100vh-190px)] relative">
          <table className="border-collapse w-max min-w-full text-xs">
            <thead className="sticky top-0 z-20 bg-slate-900 text-white shadow-sm">
              <tr>
                {/* Frozen Top-Left Corner */}
                <th className="sticky left-0 top-0 z-30 bg-slate-900 px-3 py-2.5 text-left font-bold min-w-[175px] max-w-[175px] border-r border-b border-slate-700">
                  รายชื่อทีม / พนักงาน
                </th>
                {daysArray.map(d => {
                  const isSelectedDay = d.iso === selectedDate
                  return (
                    <th
                      key={d.day}
                      onClick={() => setSelectedDate(d.iso)}
                      className={`px-2 py-1.5 text-center min-w-[125px] max-w-[125px] border-r border-b border-slate-700 cursor-pointer transition select-none ${
                        isSelectedDay
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : d.isSunday
                          ? 'bg-rose-950/90 text-rose-200'
                          : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-[10px] font-medium opacity-80">{d.dayShort}</div>
                      <div className="text-xs font-extrabold">
                        {d.day} {THAI_MONTHS_SHORT[month]}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {filteredTeams.map(team => {
                const teamWorkers = employees.filter(e => e.team_id === team.id)
                const W = teamWorkers.length
                const D = daysArray.length

                // Build 2D matrix of tasks for [wIdx][dIdx] to compute 2D rowSpan & colSpan
                const rawTasks = Array.from({ length: W }, () => Array(D).fill(''))
                const rawVehs = Array.from({ length: W }, () => Array(D).fill(null))
                for (let wIdx = 0; wIdx < W; wIdx++) {
                  const worker = teamWorkers[wIdx]
                  for (let dIdx = 0; dIdx < D; dIdx++) {
                    const dateIso = daysArray[dIdx].iso
                    const { taskDesc, vehicleId } = getWorkerScheduleForDate(worker, dateIso)
                    rawTasks[wIdx][dIdx] = taskDesc ? taskDesc.trim() : ''
                    rawVehs[wIdx][dIdx] = vehicleId || team.default_car_id
                  }
                }

                // Compute 2D merged blocks (rowSpan + colSpan)
                const skipCell = Array.from({ length: W }, () => Array(D).fill(false))
                const cellMeta = Array.from({ length: W }, () =>
                  Array.from({ length: D }, () => ({ rowSpan: 1, colSpan: 1 }))
                )

                for (let wIdx = 0; wIdx < W; wIdx++) {
                  for (let dIdx = 0; dIdx < D; dIdx++) {
                    if (skipCell[wIdx][dIdx]) continue
                    const tVal = rawTasks[wIdx][dIdx]
                    if (!tVal) continue

                    // 1. Expand downwards (rowSpan) across adjacent workers in the same team on day dIdx
                    let rSpan = 1
                    while (wIdx + rSpan < W && !skipCell[wIdx + rSpan][dIdx] && rawTasks[wIdx + rSpan][dIdx] === tVal) {
                      rSpan++
                    }

                    // 2. Expand rightwards (colSpan) across consecutive days where ALL rows in [wIdx .. wIdx+rSpan-1] have tVal
                    let cSpan = 1
                    while (dIdx + cSpan < D) {
                      let allMatch = true
                      for (let r = wIdx; r < wIdx + rSpan; r++) {
                        if (skipCell[r][dIdx + cSpan] || rawTasks[r][dIdx + cSpan] !== tVal) {
                          allMatch = false
                          break
                        }
                      }
                      if (allMatch) {
                        cSpan++
                      } else {
                        break
                      }
                    }

                    cellMeta[wIdx][dIdx] = { rowSpan: rSpan, colSpan: cSpan }
                    for (let r = wIdx; r < wIdx + rSpan; r++) {
                      for (let c = dIdx; c < dIdx + cSpan; c++) {
                        if (r === wIdx && c === dIdx) continue
                        skipCell[r][c] = true
                      }
                    }
                  }
                }

                return (
                  <React.Fragment key={team.id}>
                    {/* Team Group Header Row */}
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <td
                        onClick={() => openAssignModal(team, selectedDate, null)}
                        className="sticky left-0 z-10 bg-slate-200 hover:bg-cyan-100 px-3 py-1.5 font-extrabold text-slate-900 border-r border-slate-300 cursor-pointer flex items-center justify-between"
                        title="คลิกเพื่อสั่งงานรายทีม"
                      >
                        <span>{team.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 font-bold">
                          +สั่งงาน
                        </span>
                      </td>
                      {daysArray.map(d => (
                        <td
                          key={`th-${team.id}-${d.day}`}
                          onClick={() => openAssignModal(team, d.iso, null)}
                          className="bg-slate-100/90 hover:bg-cyan-50 px-2 py-1 text-[10px] text-slate-500 font-semibold border-r border-slate-200 cursor-pointer text-center"
                        >
                          สั่งทีม ({d.day})
                        </td>
                      ))}
                    </tr>

                    {/* Worker Rows */}
                    {teamWorkers.map((worker, wIdx) => (
                      <tr key={worker.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                        {/* Sticky Left Worker Name Cell */}
                        <td
                          onClick={() => openAssignModal(team, selectedDate, worker.id)}
                          className="sticky left-0 z-10 bg-white px-3 py-2 border-r border-slate-300 font-semibold text-slate-800 cursor-pointer hover:bg-cyan-50 whitespace-nowrap"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{worker.name}</span>
                            {worker.is_lead && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-100 text-cyan-800 font-bold shrink-0">
                                หน.
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Day Cells with 2D Merge (rowSpan + colSpan) and full-height absolute fill */}
                        {daysArray.map((d, dIdx) => {
                          if (skipCell[wIdx][dIdx]) return null

                          const tVal = rawTasks[wIdx][dIdx]
                          const vId = rawVehs[wIdx][dIdx]
                          const { rowSpan, colSpan } = cellMeta[wIdx][dIdx]
                          const lv = getWorkerLeaveOnDate(worker.id, d.iso)
                          const car = vehicles.find(v => v.id === vId)

                          if (!tVal) {
                            return (
                              <td
                                key={`${worker.id}-${d.day}`}
                                onClick={() => openAssignModal(team, d.iso, worker.id)}
                                className={`h-11 px-1.5 py-1 border-r border-slate-200 cursor-pointer transition text-center ${
                                  lv
                                    ? 'bg-amber-50/80 hover:bg-amber-100'
                                    : d.isSunday
                                    ? 'bg-rose-50/30 hover:bg-cyan-50'
                                    : 'hover:bg-cyan-50/70'
                                }`}
                              >
                                {lv ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 font-bold inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                    <span>{lv.leave_type}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-300 opacity-0 hover:opacity-100">+</span>
                                )}
                              </td>
                            )
                          }

                          const colors = getTaskColorClasses(tVal)

                          return (
                            <td
                              key={`${worker.id}-${d.day}`}
                              rowSpan={rowSpan}
                              colSpan={colSpan}
                              onClick={() => openAssignModal(team, d.iso, worker.id)}
                              className="relative p-0 border-r border-b border-slate-200 cursor-pointer align-top min-h-[44px]"
                              style={{ height: `${rowSpan * 44}px` }}
                            >
                              <div
                                className={`absolute inset-1 rounded-xl border ${colors.cellBg} p-2 flex flex-col justify-between overflow-hidden shadow-sm hover:ring-2 hover:ring-[#0284c7] transition`}
                              >
                                <div className="text-[11px] font-bold leading-snug line-clamp-3">
                                  {tVal}
                                </div>
                                <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-black/5 text-[10px] opacity-85">
                                  {car ? (
                                    <span className="font-semibold truncate flex items-center gap-1">
                                      <svg className="w-3 h-3 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="3" width="15" height="13" rx="1" />
                                        <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                                        <circle cx="5.5" cy="18.5" r="2.5" />
                                        <circle cx="18.5" cy="18.5" r="2.5" />
                                      </svg>
                                      <span>{car.name}</span>
                                    </span>
                                  ) : (
                                    <span></span>
                                  )}
                                  {rowSpan > 1 && (
                                    <span className="px-1.5 py-0.2 rounded bg-black/10 font-bold shrink-0">
                                      {rowSpan} คน
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Interactive Team Member Checkbox Assignment Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                  <span>สั่งงาน / แก้ไขแผน — {editModal.team.name}</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  วันที่ {formatThaiDateFull(editModal.dateIso)}
                </p>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Step 1: Team Member Checkboxes (Select All / Partial subset) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    1. เลือกสมาชิกใน{editModal.team.name}ที่จะรับใบงานนี้ ({editModal.checkedWorkerIds.length}/{editModal.teamWorkers.length} คน)
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setEditModal({
                          ...editModal,
                          checkedWorkerIds: editModal.teamWorkers.map(w => w.id)
                        })
                      }
                      className="text-[#0284c7] font-bold hover:underline"
                    >
                      เลือกทั้งทีม
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setEditModal({ ...editModal, checkedWorkerIds: [] })}
                      className="text-slate-500 font-semibold hover:underline"
                    >
                      ล้าง
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  {editModal.teamWorkers.map(w => {
                    const checked = editModal.checkedWorkerIds.includes(w.id)
                    const lv = getWorkerLeaveOnDate(w.id, editModal.dateIso)
                    return (
                      <label
                        key={w.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          checked
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-950'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleWorkerCheckbox(w.id)}
                          className="w-4 h-4 accent-[#0284c7] rounded"
                        />
                        <span className="truncate">
                          {w.name} {lv ? `(ลา)` : ''}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Quick Customer Site Presets + Task Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  2. รายละเอียดใบงาน / สถานที่หน้างาน
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {customerSites.map(cs => {
                    const shortSite = cs.name.split(' (')[0]
                    return (
                      <button
                        key={cs.id}
                        type="button"
                        onClick={() =>
                          setEditModal({
                            ...editModal,
                            taskDesc: editModal.taskDesc
                              ? `${shortSite} ${editModal.taskDesc}`
                              : `${shortSite} `
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-900 text-[11px] font-semibold transition"
                      >
                        +{shortSite}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setEditModal({ ...editModal, taskDesc: 'วันหยุด' })}
                    className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition"
                  >
                    +วันหยุด
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={editModal.taskDesc}
                  onChange={e => setEditModal({ ...editModal, taskDesc: e.target.value })}
                  placeholder="พิมพ์รายละเอียดใบงาน เช่น เขาหลัก ดีว่า คอริ่งช่องท่อสระ B..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                />
              </div>

              {/* Step 3: Vehicle Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  3. รถที่ใช้เดินทาง
                </label>
                <select
                  value={editModal.vehicleId || ''}
                  onChange={e => setEditModal({ ...editModal, vehicleId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0284c7]"
                >
                  <option value="">-- ไม่ระบุรถ --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plate}) — {v.status === 'available' ? 'ว่าง' : v.status === 'in_use' ? 'ใช้งาน' : 'ซ่อม'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearAssignment}
                  disabled={saving}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>ล้างงานในช่องนี้</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModal(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึกใบงาน'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full LINE Summary Text Modal (Complete all 8 teams) */}
      {lineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>ข้อความสรุปใบงานส่งกลุ่ม LINE (ครบทุกทีม)</span>
                </h3>
                <p className="text-[11px] text-emerald-100">เลือกวันที่ต้องการสรุปแล้วกดคัดลอกข้อความ</p>
              </div>
              <button
                onClick={() => setLineModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">เลือกวันที่สรุปใบงาน:</span>
                <input
                  type="date"
                  value={lineSummaryDate}
                  onChange={e => setLineSummaryDate(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                />
              </div>

              <textarea
                readOnly
                rows={16}
                value={lineSummaryText}
                className="w-full p-3.5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none"
              />
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setLineModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lineSummaryText)
                  showToast('คัดลอกข้อความสรุปใบงานทั้งหมดสำหรับส่ง LINE แล้ว!')
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>คัดลอกข้อความทั้งหมด</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Plan Revision History & Save Version */}
      {revModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>ประวัติการปรับแผนเดือน{THAI_MONTHS_FULL[month]} {year + 543}</span>
              </h3>
              <button
                onClick={() => setRevModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {monthRevisions.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">ยังไม่มีประวัติ Revision ในเดือนนี้</div>
                ) : (
                  monthRevisions.map(rev => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 font-extrabold text-[10px] mr-1.5">
                          {rev.version_code}
                        </span>
                        <span className="font-semibold text-slate-800">{rev.note}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">โดย {rev.author}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSaveRevision} className="pt-3 border-t border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  บันทึกหมายเหตุการปรับแผนครั้งใหม่
                </label>
                <input
                  type="text"
                  required
                  value={revNote}
                  onChange={e => setRevNote(e.target.value)}
                  placeholder="เช่น ปรับแผนทีมเอ๋เข้าเขาหลัก / สลับรถหกล้อ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-[#0284c7] outline-hidden"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs transition"
                >
                  {saving ? 'กำลังบันทึก...' : '+ บันทึก Revision ใหม่ลงฐานข้อมูล'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
