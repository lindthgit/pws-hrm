import React, { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { formatThaiDateFull, getTaskColorClasses, getTodayISO } from '../lib/dateUtils'

export default function DashboardPage() {
  const { activeUser, effectiveRole } = useAuth()
  const {
    selectedDate,
    setSelectedDate,
    dashboardFilter,
    setDashboardFilter,
    dashboardSubtab,
    setDashboardSubtab,
    teams,
    employees,
    vehicles,
    officeSites,
    otRequests,
    dailyDispatches,
    getAttendanceSummaryForDate,
    getWorkerScheduleForDate,
    getWorkerLeaveOnDate,
    setActiveTab,
    canViewModule
  } = useApp()

  // Clerks see their branch summary or all; Owner/HR see all; Lead sees own team or all
  const siteFilter = effectiveRole === 'clerk' && activeUser?.office_site_id
    ? activeUser.office_site_id
    : 'all'

  const summary = getAttendanceSummaryForDate(selectedDate, siteFilter)

  // Handle clicking one of the 4 top stat cards
  function handleCardClick(filterType) {
    setDashboardFilter(filterType)
    setDashboardSubtab('people')
  }

  // Vehicles summary
  const availCars = vehicles.filter(v => v.status === 'available').length
  const inUseCars = vehicles.filter(v => v.status === 'in_use').length
  const maintCars = vehicles.filter(v => v.status === 'maintenance').length

  // OT on selectedDate
  const otToday = otRequests.filter(o => o.date_val === selectedDate)
  const otApprovedCount = otToday.filter(o => o.status === 'approved').length
  const otPendingCount = otToday.filter(o => o.status === 'pending').length

  // Filtered people list for Subtab 2 ("รายชื่อคน")
  let displayedPeople = summary.allWorkers
  if (dashboardFilter === 'present') {
    displayedPeople = summary.presentWorkers
  } else if (dashboardFilter === 'leave') {
    displayedPeople = summary.leaveWorkers
  } else if (dashboardFilter === 'absent') {
    displayedPeople = summary.absentWorkers
  }

  // For lead: show all teams, but sort lead's own team to the top (index 0)
  const visibleTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      if (effectiveRole === 'lead' && activeUser?.team_id) {
        if (a.id === activeUser.team_id) return -1
        if (b.id === activeUser.team_id) return 1
      }
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
  }, [teams, effectiveRole, activeUser?.team_id])

  return (
    <div className="space-y-4">
      {/* Top Bar: Date Picker & Quick Today Button */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📊 สรุปภาพรวมประจำวัน</span>
            {!summary.isCounted && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                รอเช็คชื่อวันนี้
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{formatThaiDateFull(selectedDate)}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={() => setSelectedDate(getTodayISO())}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            วันนี้
          </button>
        </div>
      </div>

      {/* 4 Attendance Stat Cards: Selected card shows prominent border/ring without changing background or text colors (per prototype) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <button
          onClick={() => handleCardClick('all')}
          className={`p-3 rounded-2xl border text-left transition ${
            dashboardSubtab === 'people' && dashboardFilter === 'all'
              ? 'bg-white text-slate-800 border-[#0284c7] ring-2 ring-[#0284c7] shadow-sm scale-[1.02]'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500">
            ทั้งหมด
          </div>
          <div className="text-xl sm:text-2xl font-extrabold mt-0.5 text-slate-900">
            {summary.totalCount}
          </div>
        </button>

        <button
          onClick={() => handleCardClick('present')}
          className={`p-3 rounded-2xl border text-left transition ${
            dashboardSubtab === 'people' && dashboardFilter === 'present'
              ? 'bg-emerald-50/70 text-emerald-900 border-emerald-500 ring-2 ring-emerald-500 shadow-sm scale-[1.02]'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70 shadow-xs'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700">
            มาทำงาน
          </div>
          <div className="text-xl sm:text-2xl font-extrabold mt-0.5 text-emerald-950">
            {summary.isCounted ? summary.presentCount : '--'}
          </div>
        </button>

        <button
          onClick={() => handleCardClick('leave')}
          className={`p-3 rounded-2xl border text-left transition ${
            dashboardSubtab === 'people' && dashboardFilter === 'leave'
              ? 'bg-amber-50/70 text-amber-900 border-amber-500 ring-2 ring-amber-500 shadow-sm scale-[1.02]'
              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100/70 shadow-xs'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700">
            ลา
          </div>
          <div className="text-xl sm:text-2xl font-extrabold mt-0.5 text-amber-950">
            {summary.leaveCount}
          </div>
        </button>

        <button
          onClick={() => handleCardClick('absent')}
          className={`p-3 rounded-2xl border text-left transition ${
            dashboardSubtab === 'people' && dashboardFilter === 'absent'
              ? 'bg-rose-50/70 text-rose-900 border-rose-500 ring-2 ring-rose-500 shadow-sm scale-[1.02]'
              : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:bg-rose-100/70 shadow-xs'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700">
            ขาด
          </div>
          <div className="text-xl sm:text-2xl font-extrabold mt-0.5 text-rose-950">
            {summary.isCounted ? summary.absentCount : '--'}
          </div>
        </button>
      </div>

      {/* Compact Fleet & OT Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div
          onClick={() => setActiveTab('fleet')}
          className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-cyan-400 transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-base">
              🚛
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800">สถานะรถ ({vehicles.length} คัน)</div>
              <div className="text-[11px] text-slate-500">
                ว่าง {availCars} • ใช้งาน {inUseCars} • ซ่อม {maintCars}
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            ว่าง {availCars}
          </span>
        </div>

        <div
          onClick={() => ['owner', 'hr', 'clerk'].includes(effectiveRole) && setActiveTab('approvals')}
          className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-cyan-400 transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-base">
              ⏱️
            </span>
            <div>
              <div className="text-xs font-bold text-slate-800">OT ประจำวันที่เลือก</div>
              <div className="text-[11px] text-slate-500">
                อนุมัติแล้ว {otApprovedCount} คน • รออนุมัติ {otPendingCount} คน
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            รวม {otToday.length} คน
          </span>
        </div>
      </div>

      {/* 2 Subtabs: ใบงานวันนี้ | รายชื่อคน (Label strictly static) */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setDashboardSubtab('tasks')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
            dashboardSubtab === 'tasks'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 ใบงานวันนี้
        </button>
        <button
          onClick={() => setDashboardSubtab('people')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
            dashboardSubtab === 'people'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👥 รายชื่อคน
        </button>
      </div>

      {/* SUBTAB 1: ใบงานวันนี้ */}
      {dashboardSubtab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleTeams.map(team => {
            const teamWorkers = employees.filter(e => e.team_id === team.id)
            // Group team workers by their resolved task on selectedDate
            const taskGroups = {}
            teamWorkers.forEach(w => {
              const { taskDesc, vehicleId } = getWorkerScheduleForDate(w, selectedDate)
              const key = taskDesc || '__NONE__'
              if (!taskGroups[key]) {
                taskGroups[key] = {
                  taskDesc: taskDesc || 'ยังไม่ได้กำหนดใบงานวันนี้',
                  vehicleId: vehicleId || team.default_car_id,
                  workers: []
                }
              }
              taskGroups[key].workers.push(w)
            })

            const groupList = Object.values(taskGroups)
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
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isMyLeadTeam ? 'bg-[#0284c7] ring-2 ring-sky-300' : 'bg-[#0284c7]'}`}></span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{team.name}</span>
                    {isMyLeadTeam && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#0284c7] text-white shadow-xs">
                        ⭐ ทีมของคุณ
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500">({teamWorkers.length} คน)</span>
                  </div>
                  {canViewModule('planner') && (
                    <button
                      onClick={() => setActiveTab('planner')}
                      className="text-[11px] text-[#0284c7] hover:text-[#0369a1] font-bold"
                    >
                      แก้ไขแผน →
                    </button>
                  )}
                </div>

                <div className="p-3 space-y-2.5 flex-1">
                  {groupList.map((grp, idx) => {
                    const colors = getTaskColorClasses(grp.taskDesc === 'ยังไม่ได้กำหนดใบงานวันนี้' ? '' : grp.taskDesc)
                    const car = vehicles.find(v => v.id === grp.vehicleId)

                    // Check if clerk confirmed this work order dispatch
                    const dispatch = dailyDispatches.find(
                      d => d.date_val === selectedDate && d.team_id === team.id && d.task_desc === grp.taskDesc
                    )
                    const isConfirmed = Boolean(dispatch?.confirmed)

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${colors.bg} ${colors.border} space-y-2.5`}
                      >
                        <div className={`text-xs font-bold leading-snug ${colors.text}`}>
                          {grp.taskDesc}
                        </div>

                        {/* Vehicle Info */}
                        {car && (
                          <div className="flex items-center justify-between text-[11px] bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/70">
                            <span className="font-semibold text-slate-700">
                              🚛 {car.name} ({car.plate})
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                car.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : car.status === 'in_use'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {car.status === 'available' ? 'ว่าง' : car.status === 'in_use' ? 'ใช้งาน' : 'ซ่อม'}
                            </span>
                          </div>
                        )}

                        {/* Workers in this task */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
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

                        {/* Clerk Confirmation Status Badge & Remark per user request */}
                        {grp.taskDesc !== 'ยังไม่ได้กำหนดใบงานวันนี้' && (
                          <div className="pt-2 border-t border-black/5 space-y-1.5">
                            <div className="flex items-center justify-between">
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

                              {effectiveRole === 'clerk' && (
                                <button
                                  onClick={() => setActiveTab('clerk')}
                                  className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 hover:underline"
                                >
                                  {isConfirmed ? 'แก้ไขข้อความ →' : 'กดคอนเฟิร์ม →'}
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

      {/* SUBTAB 2: รายชื่อคน */}
      {dashboardSubtab === 'people' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              แสดงรายชื่อ ({displayedPeople.length} คน)
            </span>
            {!summary.isCounted && (dashboardFilter === 'present' || dashboardFilter === 'absent') && (
              <span className="text-[11px] text-amber-700 font-semibold">
                วันที่เลือกยังไม่มีการเช็คชื่อ (แสดง --)
              </span>
            )}
          </div>

          {displayedPeople.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {!summary.isCounted && (dashboardFilter === 'present' || dashboardFilter === 'absent')
                ? 'ยังไม่มีการบันทึกเช็คชื่อในวันที่เลือก (--)'
                : 'ไม่พบรายชื่อในหมวดหมู่นี้'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedPeople.map(emp => {
                const team = teams.find(t => t.id === emp.team_id)
                const site = officeSites.find(s => s.id === emp.office_site_id)
                const lv = getWorkerLeaveOnDate(emp.id, selectedDate)
                const punch = summary.punchesMap[emp.id]

                return (
                  <div
                    key={emp.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{emp.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({emp.emp_code})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {team ? team.name : emp.job_title} • สาขา{site?.name || '-'}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {lv ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                          {lv.leave_type}
                        </span>
                      ) : punch ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            punch.status === 'absent'
                              ? 'bg-rose-100 text-rose-700'
                              : punch.status === 'leave'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {punch.status === 'absent'
                            ? 'ขาดงาน'
                            : punch.status === 'leave'
                            ? 'ลา'
                            : `มา (${punch.punch_in || '07:45'} - ${punch.punch_out || '--:--'})`}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                          --
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
