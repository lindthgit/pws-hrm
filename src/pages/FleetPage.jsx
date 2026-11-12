import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'

export default function FleetPage() {
  const { effectiveRole } = useAuth()
  const { vehicles, updateVehicleStatus } = useApp()
  const [filter, setFilter] = useState('all') // 'all' | 'available' | 'in_use' | 'maintenance'

  const canManageFleet = effectiveRole === 'clerk' || effectiveRole === 'owner'

  const availCount = vehicles.filter(v => v.status === 'available').length
  const inUseCount = vehicles.filter(v => v.status === 'in_use').length
  const maintCount = vehicles.filter(v => v.status === 'maintenance').length

  const filteredVehicles = filter === 'all'
    ? vehicles
    : vehicles.filter(v => v.status === filter)

  return (
    <div className="space-y-4">
      {/* Header & Summary Filter Pills */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>สถานะรถส่วนกลาง ({vehicles.length} คัน)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">ตรวจสอบและอัปเดตสถานะการใช้งานรถประจำวัน</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            ทั้งหมด ({vehicles.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'available' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            ว่าง ({availCount})
          </button>
          <button
            onClick={() => setFilter('in_use')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'in_use' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
            }`}
          >
            ใช้งาน ({inUseCount})
          </button>
          <button
            onClick={() => setFilter('maintenance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'maintenance' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
            }`}
          >
            ซ่อม ({maintCount})
          </button>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredVehicles.map(v => {
          const isAvail = v.status === 'available'
          const isInUse = v.status === 'in_use'
          const isMaint = v.status === 'maintenance'

          return (
            <div
              key={v.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">{v.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ทะเบียน <span className="font-bold text-slate-700">{v.plate}</span> • {v.type} ({v.seats} ที่นั่ง)
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-extrabold shrink-0 ${
                    isAvail
                      ? 'bg-emerald-100 text-emerald-800'
                      : isInUse
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isAvail ? 'ว่าง' : isInUse ? 'ใช้งาน' : 'ซ่อม'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ผู้รับผิดชอบ/คนขับ:</span>
                  <span className="font-bold text-slate-800">{v.driver || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">สถานที่/ภารกิจ:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[180px]">{v.dest || '-'}</span>
                </div>
              </div>

              {/* 3 Status Buttons in a Row: ว่าง / ใช้งาน / เข้าศูนย์ */}
              {canManageFleet ? (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">เปลี่ยนสถานะรถ:</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateVehicleStatus({
                          vehicleId: v.id,
                          newStatus: 'available',
                          destText: 'จอดประจำออฟฟิศ'
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                        isAvail
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isAvail && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>ว่าง</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateVehicleStatus({
                          vehicleId: v.id,
                          newStatus: 'in_use'
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                        isInUse
                          ? 'bg-[#0284c7] text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isInUse && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>ใช้งาน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateVehicleStatus({
                          vehicleId: v.id,
                          newStatus: 'maintenance',
                          destText: 'เข้าศูนย์ / ซ่อมบำรุง'
                        })
                      }
                      className={`py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                        isMaint
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isMaint && (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>เข้าศูนย์</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
