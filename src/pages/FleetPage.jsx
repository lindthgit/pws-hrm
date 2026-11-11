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
          <h1 className="text-base font-bold text-slate-900">🚛 สถานะรถส่วนกลาง ({vehicles.length} คัน)</h1>
          <p className="text-xs text-slate-500">ตรวจสอบและอัปเดตสถานะการใช้งานรถประจำวัน</p>
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

              {canManageFleet && (
                <div className="flex items-center gap-1.5 pt-1">
                  {!isInUse && (
                    <button
                      onClick={() =>
                        updateVehicleStatus({
                          vehicleId: v.id,
                          newStatus: 'in_use'
                        })
                      }
                      className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                    >
                      ใช้งาน
                    </button>
                  )}
                  {!isAvail && (
                    <button
                      onClick={() =>
                        updateVehicleStatus({
                          vehicleId: v.id,
                          newStatus: 'available',
                          destText: 'จอดประจำออฟฟิศ'
                        })
                      }
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                    >
                      คืนรถ (ว่าง)
                    </button>
                  )}
                  {!isMaint && (
                    <button
                      onClick={() =>
                        updateVehicleStatus({
                          vehicleId: v.id,
                          newStatus: 'maintenance',
                          destText: 'เข้าศูนย์ / ซ่อมบำรุง'
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition"
                    >
                      ซ่อม
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
