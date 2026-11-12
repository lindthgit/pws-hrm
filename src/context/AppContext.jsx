import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getTodayISO, getCurrentYearMonth } from '../lib/dateUtils'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { activeUser, effectiveRole } = useAuth()

  // Real-time date sync on app startup
  const [selectedDate, setSelectedDateState] = useState(() => getTodayISO())
  const [plannerYM, setPlannerYM] = useState(() => {
    const { year, month } = getCurrentYearMonth()
    return { year, month }
  })

  // Navigation & UI state: default to 'profile' for worker, 'dashboard' for owner/clerk/hr/lead
  const [activeTab, setActiveTab] = useState(() => {
    return effectiveRole === 'worker' ? 'profile' : 'dashboard'
  })
  const [dashboardFilter, setDashboardFilter] = useState('all') // 'all' | 'present' | 'leave' | 'absent'
  const [dashboardSubtab, setDashboardSubtab] = useState('tasks') // 'tasks' | 'people'
  const [toastMessage, setToastMessage] = useState(null)

  // Live Supabase tables state (Initialized empty - 0% hardcoded data)
  const [officeSites, setOfficeSites] = useState([])
  const [customerSites, setCustomerSites] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [teams, setTeams] = useState([])
  const [allAccounts, setAllAccounts] = useState([]) // includes DEV
  const [rolePermissions, setRolePermissions] = useState([])
  const [scheduleAssignments, setScheduleAssignments] = useState([])
  const [planRevisions, setPlanRevisions] = useState([])
  const [dailyDispatches, setDailyDispatches] = useState([])
  const [dailyPunches, setDailyPunches] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [otRequests, setOtRequests] = useState([])
  const [masterAuditLogs, setMasterAuditLogs] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type, id: Date.now() })
    setTimeout(() => {
      setToastMessage(prev => (prev?.msg === msg ? null : prev))
    }, 3200)
  }, [])

  const setSelectedDate = useCallback((newDateStr) => {
    if (!newDateStr) return
    setSelectedDateState(newDateStr)
    const parts = newDateStr.split('-')
    if (parts.length === 3) {
      setPlannerYM({
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10)
      })
    }
  }, [])

  // Fetch all live data from Supabase
  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setDataLoading(true)
    try {
      const [
        osRes,
        csRes,
        vehRes,
        teamRes,
        empRes,
        permRes,
        schedRes,
        revRes,
        dispRes,
        punchRes,
        leaveRes,
        otRes,
        auditRes
      ] = await Promise.all([
        supabase.from('office_sites').select('*').order('sort_order', { ascending: true }),
        supabase.from('customer_sites').select('*').order('id', { ascending: true }),
        supabase.from('vehicles').select('*').order('sort_order', { ascending: true }),
        supabase.from('teams').select('*').order('sort_order', { ascending: true }),
        supabase.from('employees').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('role_permissions').select('*').order('id', { ascending: true }),
        supabase.from('schedule_assignments').select('*').order('date_val', { ascending: true }),
        supabase.from('plan_revisions').select('*').order('created_at', { ascending: true }),
        supabase.from('daily_dispatches').select('*'),
        supabase.from('daily_punches').select('*'),
        supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('ot_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('master_audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
      ])

      if (osRes.data) setOfficeSites(osRes.data)
      if (csRes.data) setCustomerSites(csRes.data)
      if (vehRes.data) setVehicles(vehRes.data)
      if (teamRes.data) setTeams(teamRes.data)
      if (empRes.data) setAllAccounts(empRes.data)
      if (permRes.data) setRolePermissions(permRes.data)
      if (schedRes.data) setScheduleAssignments(schedRes.data)
      if (revRes.data) setPlanRevisions(revRes.data)
      if (dispRes.data) setDailyDispatches(dispRes.data)
      if (punchRes.data) setDailyPunches(punchRes.data)
      if (leaveRes.data) setLeaveRequests(leaveRes.data)
      if (otRes.data) setOtRequests(otRes.data)
      if (auditRes.data) setMasterAuditLogs(auditRes.data)
    } catch (err) {
      console.error('Error loading Supabase data:', err)
      showToast('โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ', 'error')
    } finally {
      if (!silent) setDataLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Helper: check if a role is permitted to view, edit, or approve a module
  const canViewModule = useCallback((moduleKey, roleKey = effectiveRole) => {
    if (!roleKey) return false
    if (moduleKey === 'profile') return true // User profile is always permitted

    const perm = rolePermissions.find(p => p.role_key === roleKey && p.module_key === moduleKey)
    if (perm !== undefined) {
      return Boolean(perm.can_view)
    }

    // Default fallback matrix if rolePermissions not loaded yet
    const defaultVisibleByRole = {
      owner: ['dashboard', 'planner', 'clerk', 'fleet', 'approvals', 'selfservice', 'master'],
      hr: ['dashboard', 'clerk', 'fleet', 'approvals', 'selfservice', 'master'],
      clerk: ['dashboard', 'clerk', 'fleet', 'approvals', 'selfservice'],
      lead: ['dashboard', 'clerk', 'fleet', 'selfservice'],
      worker: ['selfservice']
    }
    return Boolean(defaultVisibleByRole[roleKey]?.includes(moduleKey))
  }, [effectiveRole, rolePermissions])

  const canEditModule = useCallback((moduleKey, roleKey = effectiveRole) => {
    if (!roleKey) return false
    const perm = rolePermissions.find(p => p.role_key === roleKey && p.module_key === moduleKey)
    if (perm !== undefined) {
      return Boolean(perm.can_edit)
    }
    return roleKey === 'owner'
  }, [effectiveRole, rolePermissions])

  const canApproveModule = useCallback((moduleKey, roleKey = effectiveRole) => {
    if (!roleKey) return false
    const perm = rolePermissions.find(p => p.role_key === roleKey && p.module_key === moduleKey)
    if (perm !== undefined) {
      return Boolean(perm.can_approve)
    }
    return roleKey === 'owner' || roleKey === 'hr'
  }, [effectiveRole, rolePermissions])

  const prevUserRoleRef = useRef({ userId: null, role: null })

  // Ensure activeTab is set per role requirements ONLY on initial login or when actively switching role:
  // "เจ้าของ/เสมียน/HR/หัวหน้าช่าง log in เข้ามา ให้ไปหน้าภาพรวมเป็นหน้าแรก ส่วนคนงานเข้ามาเห็นข้อมูลส่วนตัวหน้าแรกดีแล้ว"
  useEffect(() => {
    if (!effectiveRole || !activeUser) return
    const isNewLoginOrSwitch =
      prevUserRoleRef.current.userId !== activeUser.id ||
      prevUserRoleRef.current.role !== effectiveRole

    if (isNewLoginOrSwitch) {
      prevUserRoleRef.current = { userId: activeUser.id, role: effectiveRole }
      if (effectiveRole === 'worker') {
        setActiveTab('profile')
      } else {
        if (canViewModule('dashboard', effectiveRole)) {
          setActiveTab('dashboard')
        } else {
          const order = ['profile', 'clerk', 'selfservice', 'fleet', 'approvals', 'planner', 'master']
          const allowed = order.find(m => canViewModule(m, effectiveRole)) || 'profile'
          setActiveTab(allowed)
        }
      }
    }
  }, [activeUser?.id, effectiveRole])

  // If activeTab gets its view permission turned off in Master Data, immediately switch to first allowed tab
  useEffect(() => {
    if (!effectiveRole || rolePermissions.length === 0) return
    if (activeTab !== 'profile' && !canViewModule(activeTab, effectiveRole)) {
      const order = ['profile', 'dashboard', 'clerk', 'selfservice', 'fleet', 'approvals', 'planner', 'master']
      const fallback = order.find(m => canViewModule(m, effectiveRole)) || 'profile'
      setActiveTab(fallback)
    }
  }, [rolePermissions, effectiveRole, activeTab, canViewModule])

  // Operational employees (excludes developer account & extra test owner account E-00 so operational headcount is the exact 40 staff)
  const employees = useMemo(() => {
    return allAccounts.filter(e => !e.is_developer && e.id !== 'E-00')
  }, [allAccounts])

  // Helper: Get resolved task & vehicle for a worker on a given YYYY-MM-DD date
  const getWorkerScheduleForDate = useCallback((worker, dateStr) => {
    if (!worker || !dateStr) return { taskDesc: '', vehicleId: null, isOverride: false }
    // Check individual override first
    const indiv = scheduleAssignments.find(
      s => s.date_val === dateStr && s.team_id === worker.team_id && s.target_key === worker.id
    )
    if (indiv && indiv.task_desc) {
      return {
        taskDesc: indiv.task_desc,
        vehicleId: indiv.vehicle_id,
        isOverride: true,
        assignment: indiv
      }
    }
    // Check team assignment
    const teamRow = scheduleAssignments.find(
      s => s.date_val === dateStr && s.team_id === worker.team_id && s.target_key === '__TEAM__'
    )
    if (teamRow && teamRow.task_desc) {
      return {
        taskDesc: teamRow.task_desc,
        vehicleId: teamRow.vehicle_id,
        isOverride: false,
        assignment: teamRow
      }
    }
    return { taskDesc: '', vehicleId: null, isOverride: false, assignment: null }
  }, [scheduleAssignments])

  // Helper: Check if a worker is on approved leave on a given YYYY-MM-DD date
  const getWorkerLeaveOnDate = useCallback((workerId, dateStr) => {
    if (!workerId || !dateStr) return null
    return leaveRequests.find(
      lr => lr.worker_id === workerId &&
        lr.status === 'approved' &&
        lr.start_date <= dateStr &&
        lr.end_date >= dateStr
    ) || null
  }, [leaveRequests])

  // Helper: Get attendance summary for any date (and optional office_site_id filter)
  const getAttendanceSummaryForDate = useCallback((dateStr, siteFilter = 'all') => {
    const targetEmps = siteFilter === 'all'
      ? employees
      : employees.filter(e => e.office_site_id === siteFilter)

    const punchesOnDate = dailyPunches.filter(p => p.date_val === dateStr)
    const isCounted = punchesOnDate.length > 0

    const leaveWorkers = []
    const presentWorkers = []
    const absentWorkers = []

    targetEmps.forEach(emp => {
      const approvedLeave = getWorkerLeaveOnDate(emp.id, dateStr)
      const punch = punchesOnDate.find(p => p.worker_id === emp.id)

      if (approvedLeave || punch?.status === 'leave') {
        leaveWorkers.push({ ...emp, leaveRecord: approvedLeave, punchRecord: punch })
      } else if (isCounted) {
        if (punch?.status === 'absent') {
          absentWorkers.push({ ...emp, punchRecord: punch })
        } else {
          // Present
          presentWorkers.push({ ...emp, punchRecord: punch })
        }
      }
    })

    return {
      isCounted,
      totalCount: targetEmps.length,
      presentCount: isCounted ? presentWorkers.length : null,
      leaveCount: leaveWorkers.length,
      absentCount: isCounted ? absentWorkers.length : null,
      allWorkers: targetEmps,
      presentWorkers,
      leaveWorkers,
      absentWorkers,
      punchesMap: Object.fromEntries(punchesOnDate.map(p => [p.worker_id, p]))
    }
  }, [employees, dailyPunches, getWorkerLeaveOnDate])

  // Mutation: Save/Update schedule assignment(s) from Planner Modal
  const savePlannerAssignments = useCallback(async ({
    dateVal,
    teamId,
    selectedWorkerIds,
    allTeamWorkerIds,
    taskDesc,
    vehicleId
  }) => {
    const authorName = activeUser?.name || 'ผู้บริหาร'
    const cleanTask = String(taskDesc || '').trim()

    // Case 1: Clearing task
    if (!cleanTask) {
      const targetKeys = selectedWorkerIds.length === allTeamWorkerIds.length
        ? ['__TEAM__', ...allTeamWorkerIds]
        : selectedWorkerIds
      const { error } = await supabase
        .from('schedule_assignments')
        .delete()
        .eq('date_val', dateVal)
        .eq('team_id', teamId)
        .in('target_key', targetKeys)

      if (error) {
        showToast('ลบแผนงานไม่สำเร็จ: ' + error.message, 'error')
        return false
      }
      await fetchAllData(true)
      showToast('ล้างรายการงานในช่องที่เลือกแล้ว')
      return true
    }

    // Case 2: Assigning to the ENTIRE team -> upsert '__TEAM__' and clear individual overrides for that date/team
    const isFullTeam = allTeamWorkerIds.length > 0 && selectedWorkerIds.length === allTeamWorkerIds.length
    if (isFullTeam) {
      // Remove any individual overrides for this team on this date so everyone merges cleanly
      await supabase
        .from('schedule_assignments')
        .delete()
        .eq('date_val', dateVal)
        .eq('team_id', teamId)
        .neq('target_key', '__TEAM__')

      const { error } = await supabase
        .from('schedule_assignments')
        .upsert({
          date_val: dateVal,
          team_id: teamId,
          target_key: '__TEAM__',
          worker_id: null,
          worker_name: null,
          task_desc: cleanTask,
          vehicle_id: vehicleId || null,
          updated_by: authorName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'date_val,team_id,target_key' })

      if (error) {
        showToast('บันทึกแผนงานไม่สำเร็จ: ' + error.message, 'error')
        return false
      }
    } else {
      // Case 3: Partial subset of workers in the team -> upsert individual worker overrides
      const rows = selectedWorkerIds.map(wid => {
        const wObj = employees.find(e => e.id === wid)
        return {
          date_val: dateVal,
          team_id: teamId,
          target_key: wid,
          worker_id: wid,
          worker_name: wObj?.name || wid,
          task_desc: cleanTask,
          vehicle_id: vehicleId || null,
          updated_by: authorName,
          updated_at: new Date().toISOString()
        }
      })

      const { error } = await supabase
        .from('schedule_assignments')
        .upsert(rows, { onConflict: 'date_val,team_id,target_key' })

      if (error) {
        showToast('บันทึกแผนงานรายบุคคลไม่สำเร็จ: ' + error.message, 'error')
        return false
      }
    }

    await fetchAllData(true)
    showToast(`บันทึกแผนงาน (${selectedWorkerIds.length} คน) ลงฐานข้อมูลแล้ว`)
    return true
  }, [activeUser, employees, fetchAllData, showToast])

  // Mutation: Save a new Plan Revision log
  const createPlanRevision = useCallback(async (yearVal, monthVal, noteText) => {
    const existingForMonth = planRevisions.filter(r => r.year_val === yearVal && r.month_val === monthVal)
    const nextVersion = `v${existingForMonth.length + 1}`
    const authorName = activeUser?.name || 'คุณวิชัย'

    const { error } = await supabase
      .from('plan_revisions')
      .insert({
        year_val: yearVal,
        month_val: monthVal,
        version_code: nextVersion,
        note: noteText || `อัปเดตแผนงานประจำเดือน ${monthVal}/${yearVal + 543}`,
        author: authorName
      })

    if (error) {
      showToast('บันทึก Revision ไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast(`บันทึกแผนงานรุ่น ${nextVersion} สำเร็จ`)
    return true
  }, [planRevisions, activeUser, fetchAllData, showToast])

  // Mutation: Clerk confirms vehicle usage ("ใช้งาน") or return ("คืนรถ")
  const updateVehicleStatus = useCallback(async ({
    vehicleId,
    newStatus, // 'in_use' | 'available' | 'maintenance'
    driverName,
    destText
  }) => {
    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }
    if (driverName !== undefined) updates.driver = driverName
    if (destText !== undefined) updates.dest = destText

    const { error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)

    if (error) {
      showToast('อัปเดตสถานะรถไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    const label = newStatus === 'in_use' ? 'ใช้งาน' : (newStatus === 'available' ? 'ว่าง (คืนรถแล้ว)' : 'ซ่อมบำรุง')
    showToast(`อัปเดตสถานะรถเป็น "${label}" เรียบร้อย`)
    return true
  }, [fetchAllData, showToast])

  // Mutation: Independent Punch-In / Punch-Out or Status update for a worker
  const saveWorkerPunch = useCallback(async ({
    dateVal,
    workerId,
    officeSiteId,
    status,
    punchIn,
    punchOut,
    remarkNote,
    toastLabel
  }) => {
    const existing = dailyPunches.find(p => p.date_val === dateVal && p.worker_id === workerId)
    const payload = {
      date_val: dateVal,
      worker_id: workerId,
      office_site_id: officeSiteId || existing?.office_site_id || 'site1',
      status: status !== undefined ? status : (existing?.status || 'present'),
      punch_in: punchIn !== undefined ? punchIn : (existing?.punch_in ?? '07:45'),
      punch_out: punchOut !== undefined ? punchOut : (existing?.punch_out ?? null),
      remark_note: remarkNote !== undefined ? remarkNote : (existing?.remark_note || ''),
      recorded_by: activeUser?.name || 'เสมียน',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('daily_punches')
      .upsert(payload, { onConflict: 'date_val,worker_id' })

    if (error) {
      showToast('บันทึกเวลาไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    if (toastLabel) showToast(toastLabel)
    return true
  }, [dailyPunches, activeUser, fetchAllData, showToast])

  // Mutation: Mark all workers in site (or all sites) as Present for dateVal
  const markBatchPresent = useCallback(async (dateVal, targetWorkers) => {
    if (!targetWorkers || targetWorkers.length === 0) return false
    const existingMap = Object.fromEntries(
      dailyPunches.filter(p => p.date_val === dateVal).map(p => [p.worker_id, p])
    )

    const rows = targetWorkers.map(w => {
      const onLeave = getWorkerLeaveOnDate(w.id, dateVal)
      const prev = existingMap[w.id]
      return {
        date_val: dateVal,
        worker_id: w.id,
        office_site_id: w.office_site_id || 'site1',
        status: onLeave ? 'leave' : 'present',
        punch_in: onLeave ? null : (prev?.punch_in || '07:45'),
        punch_out: onLeave ? null : (prev?.punch_out || null),
        remark_note: onLeave ? `ลา (${onLeave.leave_type})` : (prev?.remark_note || ''),
        recorded_by: activeUser?.name || 'เสมียน',
        updated_at: new Date().toISOString()
      }
    })

    const { error } = await supabase
      .from('daily_punches')
      .upsert(rows, { onConflict: 'date_val,worker_id' })

    if (error) {
      showToast('เช็คชื่อหมู่ไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast(`บันทึกเช็คชื่อมาทำงาน (${rows.length} คน) เรียบร้อยแล้ว`)
    return true
  }, [dailyPunches, getWorkerLeaveOnDate, activeUser, fetchAllData, showToast])

  // Mutation: Submit Leave Request
  const submitLeaveRequest = useCallback(async ({
    workerId,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason
  }) => {
    const worker = employees.find(e => e.id === workerId) || activeUser
    const team = teams.find(t => t.id === worker?.team_id)

    const { error } = await supabase
      .from('leave_requests')
      .insert({
        worker_id: worker?.id || workerId,
        worker_name: worker?.name || 'พนักงาน',
        team_name: team?.name || 'สำนักงาน',
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: Number(totalDays) || 1,
        reason: reason || '-',
        status: 'pending'
      })

    if (error) {
      showToast('ส่งใบลาไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast('ส่งคำขอลาเข้าสู่ระบบเรียบร้อยแล้ว (รออนุมัติ)')
    return true
  }, [employees, activeUser, teams, fetchAllData, showToast])

  // Mutation: Approve / Reject Leave Request
  const decideLeaveRequest = useCallback(async (leaveId, newStatus) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: newStatus,
        approved_by: activeUser?.name || 'ผู้อนุมัติ',
        approved_at: new Date().toISOString()
      })
      .eq('id', leaveId)

    if (error) {
      showToast('อัปเดตสถานะใบลาไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast(newStatus === 'approved' ? 'อนุมัติใบลาเรียบร้อยแล้ว' : 'ปฏิเสธคำขอลาแล้ว')
    return true
  }, [activeUser, fetchAllData, showToast])

  // Mutation: Submit OT Request(s) (Supports single worker or multiple workers from team checklist)
  const submitOtRequests = useCallback(async ({
    workerIds,
    dateVal,
    hoursSlot,
    otHours,
    workDesc
  }) => {
    if (!workerIds || workerIds.length === 0) return false
    const rows = workerIds.map(wid => {
      const w = employees.find(e => e.id === wid) || activeUser
      const t = teams.find(tm => tm.id === w?.team_id)
      return {
        worker_id: w?.id || wid,
        worker_name: w?.name || wid,
        team_name: t?.name || 'สำนักงาน',
        date_val: dateVal,
        hours_slot: hoursSlot,
        ot_hours: Number(otHours) || 4.5,
        work_desc: workDesc || 'ทำงานล่วงเวลาหน้างาน',
        status: 'pending'
      }
    })

    const { error } = await supabase
      .from('ot_requests')
      .insert(rows)

    if (error) {
      showToast('ส่งคำขอ OT ไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast(`ส่งคำขอ OT (${rows.length} คน) เรียบร้อยแล้ว`)
    return true
  }, [employees, activeUser, teams, fetchAllData, showToast])

  // Mutation: Approve / Reject OT Request
  const decideOtRequest = useCallback(async (otId, newStatus) => {
    const { error } = await supabase
      .from('ot_requests')
      .update({
        status: newStatus,
        approved_by: activeUser?.name || 'ผู้อนุมัติ',
        approved_at: new Date().toISOString()
      })
      .eq('id', otId)

    if (error) {
      showToast('อัปเดตสถานะ OT ไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast(newStatus === 'approved' ? 'อนุมัติคำขอ OT เรียบร้อยแล้ว' : 'ปฏิเสธคำขอ OT แล้ว')
    return true
  }, [activeUser, fetchAllData, showToast])

  // Master Data Audit Logging Helper
  const logMasterChange = useCallback(async ({ actionType, entityType, entityId, targetName, details }) => {
    try {
      const payload = {
        action_type: actionType,
        entity_type: entityType,
        entity_id: String(entityId || ''),
        target_name: targetName || 'ข้อมูลในระบบ',
        details: details || '',
        performed_by_id: activeUser?.id || null,
        performed_by_name: activeUser?.name || 'ผู้ใช้งาน',
        performed_by_role: effectiveRole || 'hr',
        created_at: new Date().toISOString()
      }
      const { error } = await supabase.from('master_audit_logs').insert(payload)
      if (error) {
        console.error('Failed to insert audit log:', error)
      } else {
        const { data } = await supabase.from('master_audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
        if (data) setMasterAuditLogs(data)
      }
    } catch (err) {
      console.error('Error logging master change:', err)
    }
  }, [activeUser, effectiveRole])

  // Master Data Mutations
  const upsertEmployee = useCallback(async (empPayload) => {
    const existing = allAccounts.find(e => e.id === empPayload.id)
    const isNew = !existing
    const { error } = await supabase
      .from('employees')
      .upsert(empPayload, { onConflict: 'id' })
    if (error) {
      showToast('บันทึกข้อมูลพนักงานไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await logMasterChange({
      actionType: isNew ? 'create' : 'update',
      entityType: 'employee',
      entityId: empPayload.id,
      targetName: empPayload.name,
      details: isNew
        ? `เพิ่มพนักงานใหม่: ${empPayload.name} (${empPayload.emp_code}) ตำแหน่ง ${empPayload.job_title || '-'} สิทธิ์ ${empPayload.app_role}`
        : `แก้ไขข้อมูลพนักงาน: ${empPayload.name} (${empPayload.emp_code}) โควตาลาป่วย ${empPayload.quota_sick} วัน, ลากิจ ${empPayload.quota_personal} วัน, พักร้อน ${empPayload.quota_annual} วัน`
    })
    await fetchAllData(true)
    showToast('บันทึกข้อมูลพนักงานลงฐานข้อมูลเรียบร้อย')
    return true
  }, [allAccounts, logMasterChange, fetchAllData, showToast])

  const deleteEmployee = useCallback(async (empId, empName) => {
    const emp = allAccounts.find(e => e.id === empId)
    const name = empName || emp?.name || empId
    const { error } = await supabase
      .from('employees')
      .update({ is_active: false })
      .eq('id', empId)
    if (error) {
      showToast('ลบพนักงานไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await logMasterChange({
      actionType: 'delete',
      entityType: 'employee',
      entityId: empId,
      targetName: name,
      details: `ลบพนักงานออกจากระบบ: ${name} (${emp?.emp_code || empId})`
    })
    await fetchAllData(true)
    showToast(`ลบพนักงาน ${name} ออกจากระบบเรียบร้อยแล้ว`)
    return true
  }, [allAccounts, logMasterChange, fetchAllData, showToast])

  const upsertTeam = useCallback(async (teamPayload) => {
    const existing = teams.find(t => t.id === teamPayload.id)
    const isNew = !existing
    const { error } = await supabase
      .from('teams')
      .upsert(teamPayload, { onConflict: 'id' })
    if (error) {
      showToast('บันทึกข้อมูลทีมไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await logMasterChange({
      actionType: isNew ? 'create' : 'update',
      entityType: 'team',
      entityId: teamPayload.id,
      targetName: teamPayload.name,
      details: isNew
        ? `เพิ่มทีมช่างใหม่: ${teamPayload.name} (หน.ทีม: ${teamPayload.lead || '-'})`
        : `แก้ไขข้อมูลทีม: ${teamPayload.name} (หน.ทีม: ${teamPayload.lead || '-'}, พื้นที่: ${teamPayload.site || '-'})`
    })
    await fetchAllData(true)
    showToast('บันทึกข้อมูลทีมเรียบร้อย')
    return true
  }, [teams, logMasterChange, fetchAllData, showToast])

  const upsertVehicle = useCallback(async (vehPayload) => {
    const existing = vehicles.find(v => v.id === vehPayload.id)
    const isNew = !existing
    const { error } = await supabase
      .from('vehicles')
      .upsert(vehPayload, { onConflict: 'id' })
    if (error) {
      showToast('บันทึกข้อมูลรถไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await logMasterChange({
      actionType: isNew ? 'create' : 'update',
      entityType: 'vehicle',
      entityId: vehPayload.id,
      targetName: `${vehPayload.name} (${vehPayload.plate})`,
      details: isNew
        ? `เพิ่มรถใหม่: ${vehPayload.name} ทะเบียน ${vehPayload.plate} (${vehPayload.type})`
        : `แก้ไขข้อมูลรถ: ${vehPayload.name} ทะเบียน ${vehPayload.plate} (สถานะ: ${vehPayload.status})`
    })
    await fetchAllData(true)
    showToast('บันทึกข้อมูลรถเรียบร้อย')
    return true
  }, [vehicles, logMasterChange, fetchAllData, showToast])

  const upsertCustomerSite = useCallback(async (csPayload) => {
    const existing = customerSites.find(c => c.id === csPayload.id)
    const isNew = !existing
    const { error } = await supabase
      .from('customer_sites')
      .upsert(csPayload, { onConflict: 'id' })
    if (error) {
      showToast('บันทึกสถานที่หน้างานไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await logMasterChange({
      actionType: isNew ? 'create' : 'update',
      entityType: 'site',
      entityId: csPayload.id,
      targetName: csPayload.name,
      details: isNew
        ? `เพิ่มสถานที่หน้างานใหม่: ${csPayload.name}`
        : `แก้ไขสถานที่หน้างาน: ${csPayload.name} (${csPayload.detail || '-'})`
    })
    await fetchAllData(true)
    showToast('บันทึกสถานที่หน้างานเรียบร้อย')
    return true
  }, [customerSites, logMasterChange, fetchAllData, showToast])

  const upsertOfficeSite = useCallback(async (osPayload) => {
    const existing = officeSites.find(o => o.id === osPayload.id)
    const isNew = !existing
    const { error } = await supabase
      .from('office_sites')
      .upsert(osPayload, { onConflict: 'id' })
    if (error) {
      showToast('บันทึกข้อมูลสาขาไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await logMasterChange({
      actionType: isNew ? 'create' : 'update',
      entityType: 'site',
      entityId: osPayload.id,
      targetName: `สาขา${osPayload.name}`,
      details: isNew
        ? `เพิ่มสาขาใหม่: สาขา${osPayload.name} (เสมียน: ${osPayload.clerk_name || '-'})`
        : `แก้ไขสาขา: สาขา${osPayload.name} (เสมียน: ${osPayload.clerk_name || '-'})`
    })
    await fetchAllData(true)
    showToast('บันทึกข้อมูลสาขาเรียบร้อย')
    return true
  }, [officeSites, logMasterChange, fetchAllData, showToast])

  // Mutation: Clerk confirms work order with custom remark/note
  const confirmDailyDispatch = useCallback(async ({
    dateVal,
    teamId,
    taskDesc,
    vehicleId,
    confirmed = true,
    remark = '',
    status = 'in_use'
  }) => {
    const clerkName = activeUser?.name || 'เสมียน'
    const now = new Date()
    const confirmedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`

    const payload = {
      date_val: dateVal,
      team_id: teamId,
      task_desc: taskDesc,
      vehicle_id: vehicleId || null,
      confirmed: Boolean(confirmed),
      status: status || 'in_use',
      confirmed_time: confirmedTime,
      clerk_name: clerkName,
      remark: remark || '',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('daily_dispatches')
      .upsert(payload, { onConflict: 'date_val,team_id,task_desc' })

    if (error) {
      showToast('บันทึกคอนเฟิร์มใบงานไม่สำเร็จ: ' + error.message, 'error')
      return false
    }
    await fetchAllData(true)
    showToast(`คอนเฟิร์มใบงานเรียบร้อยแล้ว (${clerkName})`)
    return true
  }, [activeUser, fetchAllData, showToast])

  const updateRolePermission = useCallback(async ({ roleKey, moduleKey, canView, canEdit, canApprove, description }) => {
    const payload = {
      role_key: roleKey,
      module_key: moduleKey,
      can_view: Boolean(canView),
      can_edit: Boolean(canEdit),
      can_approve: Boolean(canApprove),
      description: description || ''
    }
    // Optimistic local state update
    setRolePermissions(prev => {
      const idx = prev.findIndex(p => p.role_key === roleKey && p.module_key === moduleKey)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], ...payload }
        return copy
      }
      return [...prev, payload]
    })

    const { error } = await supabase
      .from('role_permissions')
      .upsert(payload, { onConflict: 'role_key,module_key' })
    if (error) {
      showToast('ปรับสิทธิ์ไม่สำเร็จ: ' + error.message, 'error')
      await fetchAllData(true)
      return false
    }
    await logMasterChange({
      actionType: 'permission_change',
      entityType: 'permission',
      entityId: `${roleKey}_${moduleKey}`,
      targetName: `สิทธิ์ ${roleKey} ในเมนู ${moduleKey}`,
      details: `ปรับสิทธิ์: ดู=${payload.can_view ? 'ได้' : 'ไม่ได้'}, แก้ไข=${payload.can_edit ? 'ได้' : 'ไม่ได้'}, อนุมัติ=${payload.can_approve ? 'ได้' : 'ไม่ได้'}`
    })
    await fetchAllData(true)
    showToast(`อัปเดตสิทธิ์ ${roleKey} ในเมนู ${moduleKey} สำเร็จ`)
    return true
  }, [logMasterChange, fetchAllData, showToast])

  const toggleRolePermission = useCallback(async (permRow, field) => {
    const updatedVal = !permRow[field]
    const updates = { [field]: updatedVal }
    if (field === 'can_view' && !updatedVal) {
      // If view is disabled, edit and approve must also be disabled
      updates.can_edit = false
      updates.can_approve = false
    } else if ((field === 'can_edit' || field === 'can_approve') && updatedVal) {
      // If edit or approve is enabled, view must be enabled
      updates.can_view = true
    }

    // Optimistic local state update for instant UI response
    setRolePermissions(prev => prev.map(p => (p.id === permRow.id ? { ...p, ...updates } : p)))

    const { error } = await supabase
      .from('role_permissions')
      .update(updates)
      .eq('id', permRow.id)
    if (error) {
      showToast('ปรับสิทธิ์ไม่สำเร็จ: ' + error.message, 'error')
      await fetchAllData(true)
      return false
    }
    await logMasterChange({
      actionType: 'permission_change',
      entityType: 'permission',
      entityId: String(permRow.id || `${permRow.role_key}_${permRow.module_key}`),
      targetName: `สิทธิ์ ${permRow.role_key} ในเมนู ${permRow.module_key}`,
      details: `เปลี่ยนช่อง ${field === 'can_view' ? 'ดู' : field === 'can_edit' ? 'แก้ไข' : 'อนุมัติ'} เป็น: ${updatedVal ? 'เปิด' : 'ปิด'}`
    })
    await fetchAllData(true)
    showToast('อัปเดตตารางสิทธิ์การใช้งานแล้ว')
    return true
  }, [logMasterChange, fetchAllData, showToast])

  const value = {
    selectedDate,
    setSelectedDate,
    plannerYM,
    setPlannerYM,
    activeTab,
    setActiveTab,
    dashboardFilter,
    setDashboardFilter,
    dashboardSubtab,
    setDashboardSubtab,
    toastMessage,
    showToast,
    officeSites,
    customerSites,
    vehicles,
    teams,
    allAccounts,
    employees,
    rolePermissions,
    canViewModule,
    canEditModule,
    canApproveModule,
    scheduleAssignments,
    planRevisions,
    dailyDispatches,
    dailyPunches,
    leaveRequests,
    otRequests,
    masterAuditLogs,
    logMasterChange,
    dataLoading,
    fetchAllData,
    getWorkerScheduleForDate,
    getWorkerLeaveOnDate,
    getAttendanceSummaryForDate,
    savePlannerAssignments,
    createPlanRevision,
    updateVehicleStatus,
    saveWorkerPunch,
    markBatchPresent,
    submitLeaveRequest,
    decideLeaveRequest,
    submitOtRequests,
    decideOtRequest,
    confirmDailyDispatch,
    upsertEmployee,
    deleteEmployee,
    upsertTeam,
    upsertVehicle,
    upsertCustomerSite,
    upsertOfficeSite,
    updateRolePermission,
    toggleRolePermission
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
