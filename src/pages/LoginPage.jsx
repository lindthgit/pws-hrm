import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, authError, setAuthError } = useAuth()
  const [empCode, setEmpCode] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showHelper, setShowHelper] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await login(empCode, pinCode)
    setSubmitting(false)
  }

  function quickFill(code, pin) {
    setAuthError('')
    setEmpCode(code)
    setPinCode(pin)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Top Banner - Ocean Blue / Marine Theme */}
        <div className="bg-gradient-to-r from-[#0284c7] to-[#0d9488] px-6 py-7 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/30">
            <span className="text-2xl font-extrabold tracking-tight">PWS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">PWS Operations & HRM</h1>
          <p className="text-xs text-cyan-100 mt-1">ระบบวางแผนงาน เช็คชื่อ รถ และทรัพยากรบุคคล</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัสพนักงาน (Employee Code)
            </label>
            <input
              type="text"
              value={empCode}
              onChange={e => { setEmpCode(e.target.value); setAuthError('') }}
              placeholder="เช่น OWNER1, HR01, CLERK1, EMP001, DEV"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-50"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัส PIN (4 หลัก)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinCode}
              onChange={e => { setPinCode(e.target.value); setAuthError('') }}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-bold tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-50"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#0d9488] text-white font-bold text-sm shadow-lg shadow-cyan-600/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
          >
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          {/* Collapsible Helper for Testing */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowHelper(!showHelper)}
              className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-between py-1"
            >
              <span>🔑 ดูรหัสพนักงานสำหรับทดสอบ (คลิกเพื่อกรอกอัตโนมัติ)</span>
              <span>{showHelper ? '▲' : '▼'}</span>
            </button>

            {showHelper && (
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => quickFill('DEV', '9999')}
                  className="col-span-2 p-2 rounded-lg bg-slate-900 text-cyan-300 font-bold text-left hover:bg-slate-800 transition flex items-center justify-between"
                >
                  <span>🛠️ Developer (สลับ Role ทดสอบได้)</span>
                  <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">DEV / 9999</span>
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('OWNER1', '1111')}
                  className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 font-semibold text-left hover:bg-cyan-100"
                >
                  <div>👑 คุณวิชัย (Owner)</div>
                  <div className="font-mono text-[10px] text-cyan-700">OWNER1 / 1111</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('HR01', '2222')}
                  className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-semibold text-left hover:bg-purple-100"
                >
                  <div>👩‍💼 ศิริพร (HR)</div>
                  <div className="font-mono text-[10px] text-purple-700">HR01 / 2222</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('CLERK1', '3333')}
                  className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold text-left hover:bg-teal-100"
                >
                  <div>📋 เสมียน (โรงเรือ)</div>
                  <div className="font-mono text-[10px] text-teal-700">CLERK1 / 3333</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('CLERK4', '3333')}
                  className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold text-left hover:bg-teal-100"
                >
                  <div>📋 เสมียน (คุระบุรี)</div>
                  <div className="font-mono text-[10px] text-teal-700">CLERK4 / 3333</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('EMP001', '0000')}
                  className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold text-left hover:bg-blue-100"
                >
                  <div>👷 โกแนน (หัวหน้าทีม)</div>
                  <div className="font-mono text-[10px] text-blue-700">EMP001 / 0000</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickFill('EMP002', '0000')}
                  className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-left hover:bg-slate-200"
                >
                  <div>🔧 พี่ปาย (พนักงาน)</div>
                  <div className="font-mono text-[10px] text-slate-600">EMP002 / 0000</div>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
