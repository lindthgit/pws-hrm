import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { getCurrentYearMonth, formatThaiDateShort, THAI_MONTHS_FULL } from '../lib/dateUtils'

export default function ProfilePage() {
  const { activeUser } = useAuth()
  const {
    teams,
    officeSites,
    dailyPunches,
    leaveRequests,
    otRequests
  } = useApp()

  const [ym, setYm] = useState(() => getCurrentYearMonth().ymString) // YYYY-MM
  const [histTab, setHistTab] = useState('punches') // 'punches' | 'leaves' | 'ots'

  const myTeam = teams.find(t => t.id === activeUser?.team_id)
  const mySite = officeSites.find(s => s.id === activeUser?.office_site_id)

  const myPunches = useMemo(() => {
    return dailyPunches
      .filter(p => p.worker_id === activeUser?.id && String(p.date_val).startsWith(ym))
      .sort((a, b) => (a.date_val < b.date_val ? 1 : -1))
  }, [dailyPunches, activeUser, ym])

  const myLeaves = useMemo(() => {
    return leaveRequests.filter(
      l => l.worker_id === activeUser?.id && String(l.start_date).startsWith(ym)
    )
  }, [leaveRequests, activeUser, ym])

  const myOts = useMemo(() => {
    return otRequests.filter(
      o => o.worker_id === activeUser?.id && String(o.date_val).startsWith(ym)
    )
  }, [otRequests, activeUser, ym])

  const approvedLeavesAllYear = useMemo(() => {
    return leaveRequests.filter(
      l => l.worker_id === activeUser?.id && l.status === 'approved'
    )
  }, [leaveRequests, activeUser])

  const usedSick = approvedLeavesAllYear
    .filter(l => l.leave_type === 'ลาป่วย')
    .reduce((acc, r) => acc + (Number(r.total_days) || 1), 0)
  const usedPersonal = approvedLeavesAllYear
    .filter(l => l.leave_type === 'ลากิจ')
    .reduce((acc, r) => acc + (Number(r.total_days) || 1), 0)
  const usedAnnual = approvedLeavesAllYear
    .filter(l => l.leave_type === 'ลาพักร้อน')
    .reduce((acc, r) => acc + (Number(r.total_days) || 1), 0)

  const [yNum, mNum] = ym.split('-').map(Number)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* User Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0284c7] text-white font-extrabold text-xl flex items-center justify-center shadow-md">
            {activeUser?.name?.slice(0, 2) || 'PW'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900">{activeUser?.name}</h1>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold">
                {activeUser?.emp_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ตำแหน่ง: <span className="font-semibold text-slate-700">{activeUser?.job_title}</span>
              {myTeam && ` • สังกัด${myTeam.name}`}
              {mySite && ` • สาขา${mySite.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
          <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs font-bold text-slate-600">เลือกเดือน:</span>
          <input
            type="month"
            value={ym}
            onChange={e => setYm(e.target.value)}
            className="bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-bold text-slate-900"
          />
        </div>
      </div>

      {/* Quota Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">โควตาลาป่วย</div>
          <div className="text-lg font-extrabold text-blue-600 mt-0.5">
            เหลือ {(activeUser?.quota_sick ?? 30) - usedSick} / {activeUser?.quota_sick ?? 30} วัน
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">โควตาลากิจ</div>
          <div className="text-lg font-extrabold text-amber-600 mt-0.5">
            เหลือ {(activeUser?.quota_personal ?? 6) - usedPersonal} / {activeUser?.quota_personal ?? 6} วัน
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500">โควตาพักร้อน</div>
          <div className="text-lg font-extrabold text-emerald-600 mt-0.5">
            เหลือ {(activeUser?.quota_annual ?? 6) - usedAnnual} / {activeUser?.quota_annual ?? 6} วัน
          </div>
        </div>
      </div>

      {/* 3 History Tabs: ตอกบัตร | การลา | ทำ OT */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setHistTab('punches')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
            histTab === 'punches' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          ⏰ ประวัติตอกบัตร ({myPunches.length})
        </button>
        <button
          onClick={() => setHistTab('leaves')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            histTab === 'leaves' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>ประวัติการลา ({myLeaves.length})</span>
        </button>
        <button
          onClick={() => setHistTab('ots')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            histTab === 'ots' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>ประวัติทำ OT ({myOts.length})</span>
        </button>
      </div>

      {/* History Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            ข้อมูลประจำเดือน{THAI_MONTHS_FULL[mNum]} {yNum + 543}
          </span>
        </div>

        {histTab === 'punches' && (
          <div className="divide-y divide-slate-100">
            {myPunches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                ไม่มีข้อมูลการตอกบัตรในเดือนที่เลือก
              </div>
            ) : (
              myPunches.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{formatThaiDateShort(p.date_val)}</div>
                    {p.remark_note && <div className="text-[11px] text-amber-700">{p.remark_note}</div>}
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      เข้า: {p.punch_in || '--:--'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      ออก: {p.punch_out || '--:--'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {histTab === 'leaves' && (
          <div className="divide-y divide-slate-100">
            {myLeaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                ไม่มีประวัติการลาในเดือนที่เลือก
              </div>
            ) : (
              myLeaves.map(lv => (
                <div key={lv.id} className="px-4 py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">
                      {lv.leave_type} ({lv.total_days} วัน) — {formatThaiDateShort(lv.start_date)}
                    </div>
                    <div className="text-[11px] text-slate-500">เหตุผล: {lv.reason}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      lv.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {lv.status === 'approved' ? (
                      '✓ อนุมัติแล้ว'
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>รออนุมัติ</span>
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {histTab === 'ots' && (
          <div className="divide-y divide-slate-100">
            {myOts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                ไม่มีประวัติการทำ OT ในเดือนที่เลือก
              </div>
            ) : (
              myOts.map(ot => (
                <div key={ot.id} className="px-4 py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">
                      {formatThaiDateShort(ot.date_val)} • {ot.hours_slot}
                    </div>
                    <div className="text-[11px] text-slate-500">งาน: {ot.work_desc}</div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      ot.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ot.status === 'approved' ? (
                      '✓ อนุมัติแล้ว'
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>รออนุมัติ</span>
                      </span>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
