import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function MasterDataPage() {
  const {
    teams,
    employees,
    vehicles,
    officeSites,
    customerSites,
    rolePermissions,
    masterAuditLogs,
    upsertEmployee,
    deleteEmployee,
    upsertTeam,
    upsertVehicle,
    upsertCustomerSite,
    upsertOfficeSite,
    toggleRolePermission,
    updateRolePermission,
    masterSubtab,
    setMasterSubtab
  } = useApp()

  const tab = masterSubtab || 'employees'
  const setTab = setMasterSubtab || (() => {})
  const [empModal, setEmpModal] = useState(null)
  const [teamModal, setTeamModal] = useState(null)
  const [vehModal, setVehModal] = useState(null)
  const [csModal, setCsModal] = useState(null)
  const [officeSiteModal, setOfficeSiteModal] = useState(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)

  const moduleLabels = {
    dashboard: '1. ภาพรวม (Dashboard)',
    planner: '2. วางแผนเดือน (Planner)',
    clerk: '3. ใบงาน/ลงเวลา',
    fleet: '4. สถานะรถ (Fleet)',
    approvals: '5. วันลา & OT',
    selfservice: '6. ยื่นใบลา / OT (Self-Service)',
    master: '7. ตั้งค่าระบบ (Master Data)'
  }

  const roleColumns = [
    { key: 'owner', label: '👑 Owner' },
    { key: 'hr', label: '👩‍💼 HR' },
    { key: 'clerk', label: '📋 เสมียน' },
    { key: 'lead', label: '👷 หน.ทีม' },
    { key: 'worker', label: '🔧 พนักงาน' }
  ]

  async function handleSaveEmp(e) {
    e.preventDefault()
    if (!empModal) return
    const ok = await upsertEmployee({
      ...empModal,
      quota_sick: Number(empModal.quota_sick) || 30,
      quota_personal: Number(empModal.quota_personal) || 6,
      quota_annual: Number(empModal.quota_annual) || 6
    })
    if (ok) setEmpModal(null)
  }

  async function confirmDeleteEmp() {
    if (!deleteConfirmModal) return
    const ok = await deleteEmployee(deleteConfirmModal.id, deleteConfirmModal.name)
    if (ok) {
      setDeleteConfirmModal(null)
      setEmpModal(null)
    }
  }

  async function handleSaveTeam(e) {
    e.preventDefault()
    if (!teamModal) return
    const ok = await upsertTeam(teamModal)
    if (ok) setTeamModal(null)
  }

  async function handleSaveVeh(e) {
    e.preventDefault()
    if (!vehModal) return
    const ok = await upsertVehicle(vehModal)
    if (ok) setVehModal(null)
  }

  async function handleSaveCs(e) {
    e.preventDefault()
    if (!csModal) return
    const ok = await upsertCustomerSite(csModal)
    if (ok) setCsModal(null)
  }

  async function handleSaveOfficeSite(e) {
    e.preventDefault()
    if (!officeSiteModal) return
    const ok = await upsertOfficeSite(officeSiteModal)
    if (ok) setOfficeSiteModal(null)
  }

  // Handle toggling permission safely whether perm row already exists or needs upsert
  async function handleTogglePerm(roleKey, modKey, field) {
    const perm = rolePermissions.find(p => p.role_key === roleKey && p.module_key === modKey)
    if (perm && perm.id) {
      await toggleRolePermission(perm, field)
    } else {
      await updateRolePermission({
        roleKey,
        moduleKey: modKey,
        canView: field === 'can_view',
        canEdit: field === 'can_edit',
        canApprove: field === 'can_approve',
        description: field === 'can_edit' ? 'แก้ไข' : (field === 'can_approve' ? 'อนุมัติ' : 'ดูข้อมูล')
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Subtabs */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>ตั้งค่าระบบ & ข้อมูลหลัก (Master Data)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">ข้อมูลทั้งหมดเชื่อมต่อกับ Supabase แบบเรียลไทม์</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'employees', label: `พนักงาน (${employees.length})` },
            { id: 'teams', label: `ทีมช่าง (${teams.length})` },
            { id: 'vehicles', label: `รถ (${vehicles.length})` },
            { id: 'sites', label: `สาขา & หน้างาน` },
            { id: 'permissions', label: `ตารางสิทธิ์ (5 Roles)` },
            { id: 'audit', label: `ประวัติการแก้ไข (${masterAuditLogs.length})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === t.id
                  ? 'bg-[#0284c7] text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EMPLOYEES */}
      {tab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              รายชื่อพนักงาน, รหัสเข้าใช้งาน และโควตาวันลาต่อปี ({employees.length} คน)
            </span>
            <button
              onClick={() =>
                setEmpModal({
                  id: `W-${employees.length + 10}`,
                  emp_code: `EMP0${employees.length + 1}`,
                  pin_code: '0000',
                  emp_no: String(employees.length + 1),
                  name: '',
                  job_title: 'ช่างเทคนิค',
                  app_role: 'worker',
                  is_developer: false,
                  team_id: teams[0]?.id || 'team_nan',
                  office_site_id: 'site1',
                  is_lead: false,
                  quota_sick: 30,
                  quota_personal: 6,
                  quota_annual: 6,
                  is_active: true,
                  sort_order: employees.length + 5
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs transition"
            >
              + เพิ่มพนักงานใหม่
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">รหัส Login</th>
                  <th className="px-3 py-2.5">PIN</th>
                  <th className="px-3 py-2.5">ชื่อ - นามสกุล</th>
                  <th className="px-3 py-2.5">ตำแหน่ง</th>
                  <th className="px-3 py-2.5">ทีม / สาขา</th>
                  <th className="px-3 py-2.5">Role สิทธิ์</th>
                  <th className="px-3 py-2.5 text-center">โควตาลาต่อปี (ป่วย/กิจ/พักร้อน)</th>
                  <th className="px-3 py-2.5 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => {
                  const tm = teams.find(t => t.id === emp.team_id)
                  const os = officeSites.find(s => s.id === emp.office_site_id)
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{emp.emp_code}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">{emp.pin_code}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{emp.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{emp.job_title}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {tm ? tm.name : '-'} / สาขา{os?.name || '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 font-bold text-[#0284c7]">
                          {emp.app_role}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <span className="text-emerald-700 font-bold">{emp.quota_sick ?? 30}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="text-amber-700 font-bold">{emp.quota_personal ?? 6}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="text-blue-700 font-bold">{emp.quota_annual ?? 6}</span>
                        <span className="text-slate-500 text-[11px] ml-1">วัน</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setEmpModal({ ...emp })}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-900 font-bold transition"
                        >
                          แก้ไข
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS */}
      {tab === 'teams' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">รายการทีมช่าง ({teams.length} ทีม)</span>
            <button
              onClick={() =>
                setTeamModal({
                  id: `team_${teams.length + 1}`,
                  name: '',
                  lead: employees[0]?.name || '',
                  default_car_id: vehicles[0]?.id || 'v1',
                  site: '',
                  office_site_id: 'site1',
                  sort_order: teams.length + 1
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs transition"
            >
              + เพิ่มทีมช่าง
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
            {teams.map(t => {
              const car = vehicles.find(v => v.id === t.default_car_id)
              const count = employees.filter(e => e.team_id === t.id).length
              return (
                <div key={t.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-cyan-300 transition">
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {t.name} ({count} คน)
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      หัวหน้าทีม: <span className="font-bold text-[#0284c7]">{t.lead || '-'}</span> • รถประจำทีม: {car?.name || '-'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">พื้นที่หลัก: {t.site || '-'}</div>
                  </div>
                  <button
                    onClick={() => setTeamModal({ ...t })}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-100 text-xs font-bold text-slate-700 hover:text-cyan-900 transition"
                  >
                    แก้ไข
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLES */}
      {tab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">ข้อมูลรถทั้งหมด ({vehicles.length} คัน)</span>
            <button
              onClick={() =>
                setVehModal({
                  id: `v${vehicles.length + 1}`,
                  name: '',
                  plate: '',
                  type: 'กระบะ 4 ประตู',
                  seats: 5,
                  status: 'available',
                  driver: '-',
                  dest: 'ประจำออฟฟิศ',
                  sort_order: vehicles.length + 1
                })
              }
              className="px-3 py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs transition"
            >
              + เพิ่มรถใหม่
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {vehicles.map(v => (
              <div key={v.id} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                <div>
                  <span className="font-bold text-slate-900">{v.name}</span> • ทะเบียน{' '}
                  <span className="font-bold text-slate-700">{v.plate}</span> ({v.type}, {v.seats} ที่นั่ง)
                </div>
                <button
                  onClick={() => setVehModal({ ...v })}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 font-bold text-slate-700 hover:text-cyan-900 transition"
                >
                  แก้ไข
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SITES */}
      {tab === 'sites' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Office Sites */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">🏢 สาขาออฟฟิศ / โรงงาน ({officeSites.length} แห่ง)</span>
              <button
                onClick={() =>
                  setOfficeSiteModal({
                    id: `site${officeSites.length + 1}`,
                    name: '',
                    clerk_name: '',
                    sort_order: officeSites.length + 1
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] transition shadow-xs"
              >
                + เพิ่มสาขา
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {officeSites.map(os => (
                <div key={os.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900">สาขา{os.name}</div>
                    <div className="text-slate-500 mt-0.5">เสมียนประจำสาขา: <span className="font-bold text-[#0284c7]">{os.clerk_name || '-'}</span></div>
                  </div>
                  <button
                    onClick={() => setOfficeSiteModal({ ...os })}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 font-bold text-slate-700 hover:text-cyan-900 transition"
                  >
                    แก้ไข
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Sites */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">📍 หน้างานลูกค้า ({customerSites.length} แห่ง)</span>
              <button
                onClick={() =>
                  setCsModal({
                    id: `cs${customerSites.length + 1}`,
                    name: '',
                    detail: '',
                    category_color: 'blue'
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] transition shadow-xs"
              >
                + เพิ่มหน้างาน
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {customerSites.map(cs => (
                <div key={cs.id} className="p-3.5 flex items-center justify-between gap-2 text-xs hover:bg-slate-50 transition">
                  <div>
                    <div className="font-bold text-slate-900">{cs.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{cs.detail}</div>
                  </div>
                  <button
                    onClick={() => setCsModal({ ...cs })}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-100 font-bold text-slate-700 hover:text-cyan-900 shrink-0 transition"
                  >
                    แก้ไข
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 5-ROLE PERMISSIONS MATRIX (INTERACTIVE CHECKBOXES) */}
      {tab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold">🔐 ตารางสิทธิ์การใช้งานระบบตามตำแหน่ง (5 Roles Matrix)</h2>
              <p className="text-[11px] text-slate-400">ติ๊กถูกเพื่อเปิดหรือปิดสิทธิ์ ดู (View) / แก้ไข (Edit) / อนุมัติ (Approve) ซิงค์กับฐานข้อมูลทันที</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-56">เมนู / ฟีเจอร์</th>
                  {roleColumns.map(rc => (
                    <th key={rc.key} className="px-3 py-3 text-center border-l border-slate-200">{rc.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(moduleLabels).map(modKey => (
                  <tr key={modKey} className="hover:bg-cyan-50/30 transition">
                    <td className="px-4 py-3 font-bold text-slate-800 align-top">
                      {moduleLabels[modKey]}
                    </td>
                    {roleColumns.map(rc => {
                      const perm = rolePermissions.find(
                        p => p.role_key === rc.key && p.module_key === modKey
                      )
                      const isView = Boolean(perm?.can_view)
                      const isEdit = Boolean(perm?.can_edit)
                      const isApprove = Boolean(perm?.can_approve)
                      const showApprove = ['approvals', 'clerk', 'master', 'planner'].includes(modKey)

                      return (
                        <td key={rc.key} className="px-2.5 py-2.5 text-center border-l border-slate-100 align-middle">
                          <div className="inline-flex flex-col gap-1.5 text-left bg-slate-50 p-2 rounded-xl border border-slate-200 min-w-[90px]">
                            {/* Checkbox: View */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700 hover:text-slate-900">
                              <input
                                type="checkbox"
                                checked={isView}
                                onChange={() => handleTogglePerm(rc.key, modKey, 'can_view')}
                                className="w-3.5 h-3.5 rounded text-[#0284c7] focus:ring-[#0284c7] border-slate-300"
                              />
                              <span>ดูข้อมูล</span>
                            </label>

                            {/* Checkbox: Edit */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700 hover:text-slate-900">
                              <input
                                type="checkbox"
                                checked={isEdit}
                                onChange={() => handleTogglePerm(rc.key, modKey, 'can_edit')}
                                className="w-3.5 h-3.5 rounded text-[#0284c7] focus:ring-[#0284c7] border-slate-300"
                              />
                              <span>แก้ไขได้</span>
                            </label>

                            {/* Checkbox: Approve (for actionable modules) */}
                            {showApprove && (
                              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700 hover:text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={isApprove}
                                  onChange={() => handleTogglePerm(rc.key, modKey, 'can_approve')}
                                  className="w-3.5 h-3.5 rounded text-[#0d9488] focus:ring-[#0d9488] border-slate-300"
                                />
                                <span className="text-[#0d9488] font-bold">อนุมัติ</span>
                              </label>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOG */}
      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-800">
                📜 ประวัติการเปลี่ยนแปลงข้อมูลหลักทั้งหมด ({masterAuditLogs.length} รายการล่าสุด)
              </span>
              <p className="text-[11px] text-slate-500">
                บันทึกการแก้ไข พนักงาน, ทีม, รถ, สาขา และสิทธิ์ เพื่อให้ตรวจสอบย้อนหลังได้ชัดเจน
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {masterAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                ยังไม่มีประวัติการแก้ไขข้อมูลในระบบ
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 whitespace-nowrap">วัน - เวลา</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">การกระทำ</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">หมวดหมู่</th>
                    <th className="px-3 py-2.5">รายการที่แก้ไข</th>
                    <th className="px-3 py-2.5">รายละเอียด</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">ผู้ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {masterAuditLogs.map(log => {
                    const dateObj = new Date(log.created_at)
                    const timeStr = dateObj.toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">{timeStr}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            log.action_type === 'delete'
                              ? 'bg-rose-100 text-rose-700'
                              : log.action_type === 'create'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.action_type === 'permission_change'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}>
                            {log.action_type === 'delete' ? 'ลบข้อมูล' : log.action_type === 'create' ? 'เพิ่มใหม่' : log.action_type === 'permission_change' ? 'เปลี่ยนสิทธิ์' : 'แก้ไข'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          {log.entity_type === 'employee' ? '👥 พนักงาน' : log.entity_type === 'team' ? '👷 ทีม' : log.entity_type === 'vehicle' ? '🚛 รถ' : log.entity_type === 'site' ? '📍 สาขา/หน้างาน' : '🔐 สิทธิ์'}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{log.target_name}</td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-xs">{log.details || '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{log.performed_by_name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({log.performed_by_role})</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Employee Edit/Add Modal */}
      {empModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">👥 ข้อมูลพนักงาน, สิทธิ์ & โควตาวันลา</h3>
              <button onClick={() => setEmpModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveEmp} className="p-5 space-y-3 text-xs max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัสพนักงาน (Login)</label>
                  <input
                    type="text"
                    required
                    value={empModal.emp_code}
                    onChange={e => setEmpModal({ ...empModal, emp_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">รหัส PIN</label>
                  <input
                    type="text"
                    required
                    value={empModal.pin_code}
                    onChange={e => setEmpModal({ ...empModal, pin_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อ - นามสกุล / ชื่อเล่น</label>
                <input
                  type="text"
                  required
                  value={empModal.name}
                  onChange={e => setEmpModal({ ...empModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={empModal.job_title}
                    onChange={e => setEmpModal({ ...empModal, job_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0284c7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สิทธิ์ในระบบ (Role)</label>
                  <select
                    value={empModal.app_role}
                    onChange={e => setEmpModal({ ...empModal, app_role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                  >
                    <option value="worker">worker (พนักงาน)</option>
                    <option value="lead">lead (หัวหน้าทีม)</option>
                    <option value="clerk">clerk (เสมียนสาขา)</option>
                    <option value="hr">hr (ฝ่ายบุคคล)</option>
                    <option value="owner">owner (เจ้าของ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ทีมสังกัด</label>
                  <select
                    value={empModal.team_id || ''}
                    onChange={e => setEmpModal({ ...empModal, team_id: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#0284c7] outline-hidden"
                  >
                    <option value="">-- ไม่สังกัดทีมช่าง --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">สาขาประจำ</label>
                  <select
                    value={empModal.office_site_id || 'site1'}
                    onChange={e => setEmpModal({ ...empModal, office_site_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#0284c7] outline-hidden"
                  >
                    {officeSites.map(s => (
                      <option key={s.id} value={s.id}>สาขา{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Annual Leave Quota Section */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block font-bold text-slate-900 mb-2">🏖️ โควตาวันลาต่อปี (ใช้คำนวณวันลาคงเหลือ)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">ลาป่วย (วัน/ปี)</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={empModal.quota_sick ?? 30}
                      onChange={e => setEmpModal({ ...empModal, quota_sick: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-center text-xs"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200">
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">ลากิจ (วัน/ปี)</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={empModal.quota_personal ?? 6}
                      onChange={e => setEmpModal({ ...empModal, quota_personal: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-center text-xs"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200">
                    <label className="block text-[11px] font-bold text-blue-900 mb-1">พักร้อน (วัน/ปี)</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={empModal.quota_annual ?? 6}
                      onChange={e => setEmpModal({ ...empModal, quota_annual: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg border border-blue-300 bg-white font-mono font-bold text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {employees.some(e => e.id === empModal.id) ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmModal({ id: empModal.id, name: empModal.name, emp_code: empModal.emp_code })}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200"
                  >
                    <span>🗑️</span>
                    <span>ลบพนักงาน</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmpModal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-bold shadow-xs transition"
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              🗑️
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-base font-bold text-slate-900">ยืนยันการลบพนักงาน?</h4>
              <p className="text-xs text-slate-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน <span className="font-bold text-slate-900">{deleteConfirmModal.name}</span> ({deleteConfirmModal.emp_code}) ออกจากระบบ?
              </p>
              <p className="text-[11px] text-slate-400">
                พนักงานจะถูกปลดออกจากระบบและไม่สามารถล็อกอินหรือเข้าใช้งานได้อีก
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmp}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Modal (with Employee Select for Lead) */}
      {teamModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">👷 ข้อมูลทีมช่าง</h3>
              <button onClick={() => setTeamModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveTeam} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อทีม</label>
                <input
                  type="text"
                  required
                  value={teamModal.name}
                  onChange={e => setTeamModal({ ...teamModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:border-[#0284c7] outline-hidden"
                />
              </div>

              {/* หัวหน้าทีมเลือกจากพนักงาน */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  หัวหน้าทีม (เลือกจากรายชื่อพนักงาน)
                </label>
                <select
                  required
                  value={teamModal.lead || ''}
                  onChange={e => setTeamModal({ ...teamModal, lead: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  <option value="">-- เลือกหัวหน้าทีม --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.job_title || emp.app_role})
                    </option>
                  ))}
                  {/* Fallback if current lead is not in employees list */}
                  {teamModal.lead && !employees.some(e => e.name === teamModal.lead) && (
                    <option value={teamModal.lead}>{teamModal.lead} (เดิม)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">รถประจำทีม</label>
                <select
                  value={teamModal.default_car_id || ''}
                  onChange={e => setTeamModal({ ...teamModal, default_car_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:border-[#0284c7] outline-hidden"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">พื้นที่รับผิดชอบหลัก</label>
                <input
                  type="text"
                  value={teamModal.site || ''}
                  onChange={e => setTeamModal({ ...teamModal, site: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0284c7] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTeamModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-bold shadow-xs transition"
                >
                  บันทึกทีม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Site Modal (Editable Office Sites) */}
      {officeSiteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">🏢 แก้ไขสาขาออฟฟิศ / โรงงาน</h3>
              <button onClick={() => setOfficeSiteModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveOfficeSite} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสาขา (เช่น พระราม 2, สุขุมวิท)</label>
                <input
                  type="text"
                  required
                  value={officeSiteModal.name}
                  onChange={e => setOfficeSiteModal({ ...officeSiteModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:border-[#0284c7] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">เสมียนประจำสาขา</label>
                <select
                  value={officeSiteModal.clerk_name || ''}
                  onChange={e => setOfficeSiteModal({ ...officeSiteModal, clerk_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:border-[#0284c7] outline-hidden"
                >
                  <option value="">-- เลือกเสมียนประจำสาขา --</option>
                  {employees
                    .filter(e => e.app_role === 'clerk' || e.app_role === 'hr' || e.job_title?.includes('เสมียน'))
                    .map(e => (
                      <option key={e.id} value={e.name}>{e.name} ({e.job_title})</option>
                    ))}
                  {/* In case any employee is assigned */}
                  {employees
                    .filter(e => e.app_role !== 'clerk' && !e.job_title?.includes('เสมียน'))
                    .map(e => (
                      <option key={e.id} value={e.name}>{e.name} ({e.app_role})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ลำดับการแสดงผล (Sort Order)</label>
                <input
                  type="number"
                  value={officeSiteModal.sort_order ?? 1}
                  onChange={e => setOfficeSiteModal({ ...officeSiteModal, sort_order: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:border-[#0284c7] outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfficeSiteModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-bold shadow-xs transition"
                >
                  บันทึกสาขา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {vehModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">🚛 ข้อมูลรถส่วนกลาง</h3>
              <button onClick={() => setVehModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveVeh} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อเรียกรถ</label>
                <input
                  type="text"
                  required
                  value={vehModal.name}
                  onChange={e => setVehModal({ ...vehModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:border-[#0284c7] outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ทะเบียนรถ</label>
                  <input
                    type="text"
                    required
                    value={vehModal.plate}
                    onChange={e => setVehModal({ ...vehModal, plate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0284c7] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">จำนวนที่นั่ง</label>
                  <input
                    type="number"
                    value={vehModal.seats}
                    onChange={e => setVehModal({ ...vehModal, seats: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0284c7] outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ประเภทรถ</label>
                <input
                  type="text"
                  value={vehModal.type}
                  onChange={e => setVehModal({ ...vehModal, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0284c7] outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVehModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-bold shadow-xs transition"
                >
                  บันทึกรถ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Site Modal */}
      {csModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">📍 ข้อมูลสถานที่หน้างานลูกค้า</h3>
              <button onClick={() => setCsModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveCs} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อสถานที่ / โครงการ</label>
                <input
                  type="text"
                  required
                  value={csModal.name}
                  onChange={e => setCsModal({ ...csModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:border-[#0284c7] outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">รายละเอียดงานหลัก</label>
                <textarea
                  rows={2}
                  value={csModal.detail}
                  onChange={e => setCsModal({ ...csModal, detail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#0284c7] outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCsModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold hover:bg-slate-200 text-slate-700 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-bold shadow-xs transition"
                >
                  บันทึกหน้างาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
