import React, { useState } from 'react'
import {
  UserCheck2,
  Clock,
  Camera,
  CheckCircle2,
  Calendar,
  Sparkles,
  Search,
  User,
  ShieldCheck,
  Building2,
  CameraOff,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { useApp } from '../../context/AppContext'
import { formatDateTime } from '../../lib/utils'

export const AttendanceView: React.FC = () => {
  const { currentLocation } = useApp()
  const { attendanceRecords, clockIn, clockOut } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [pinInput, setPinInput] = useState<string>('')
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('Tomas Kowalski')
  const [selectedRole, setSelectedRole] = useState<string>('Production Baker')
  const [isPhotoCapturing, setIsPhotoCapturing] = useState<boolean>(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Sample employee list for touch selection
  const employeeDirectory = [
    { id: 'usr-3', name: 'Tomas Kowalski', role: 'Production Baker', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { id: 'usr-7', name: 'Maya Patel', role: 'Retail Cashier', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
    { id: 'usr-5', name: 'Carlos Rivera', role: 'Dispatch Coordinator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { id: 'usr-6', name: 'Emily Chen', role: 'Store Manager', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' },
    { id: 'usr-2', name: 'Chef Marcel Dubois', role: 'Commissary Head', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&auto=format&fit=crop&q=80' },
  ]

  const currentEmp = employeeDirectory.find((e) => e.name === selectedEmployeeName) || employeeDirectory[0]

  // Check if employee has an open clock-in today without clock-out
  const activeRecord = attendanceRecords.find(
    (a) => a.employeeName === selectedEmployeeName && !a.clockOut
  )

  const handleClockInAction = () => {
    setIsPhotoCapturing(true)
    setTimeout(() => {
      setIsPhotoCapturing(false)
      clockIn(
        currentEmp.id,
        currentEmp.name,
        currentEmp.role,
        currentLocation.id,
        currentEmp.avatar
      )
      showToast(`Clocked IN: ${currentEmp.name} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`)
      setPinInput('')
    }, 1000)
  }

  const handleClockOutAction = () => {
    if (!activeRecord) return
    clockOut(activeRecord.id)
    showToast(`Clocked OUT: ${currentEmp.name} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`)
    setPinInput('')
  }

  const handleNumpadPress = (digit: string) => {
    if (pinInput.length < 4) {
      setPinInput(pinInput + digit)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-600 text-white shadow-xs">
            <UserCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Attendance & Clock-In Kiosk</h2>
            <p className="text-xs text-stone-500">
              Tablet punch clock with employee PIN verification, webcam snapshot simulation, and shift logs.
            </p>
          </div>
        </div>

        <div className="text-xs bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-stone-400" />
          <span>Kiosk Terminal: <strong>{currentLocation.name}</strong></span>
        </div>
      </div>

      {/* Main Kiosk Area: Interactive Punch Clock + Webcam (8 cols) + Directory (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Punch Clock Terminal */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            {/* Selected Employee Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentEmp.avatar}
                  alt={currentEmp.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-stone-200 shadow-xs"
                />
                {activeRecord ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white absolute -bottom-1 -right-1" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-stone-300 ring-2 ring-white absolute -bottom-1 -right-1" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">{currentEmp.name}</h3>
                <span className="text-xs text-stone-500 font-semibold">{currentEmp.role}</span>
                <div className="mt-1">
                  {activeRecord ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Clocked IN at {activeRecord.clockIn}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                      Currently Clocked OUT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Webcam Photo Verification Simulation Box */}
            <div className="w-44 h-32 bg-stone-950 rounded-xl overflow-hidden relative border border-stone-700 shadow-inner flex items-center justify-center">
              {isPhotoCapturing ? (
                <div className="absolute inset-0 bg-white flex items-center justify-center animate-ping">
                  <Camera className="w-8 h-8 text-amber-500" />
                </div>
              ) : (
                <img
                  src={currentEmp.avatar}
                  alt="Webcam Preview"
                  className="w-full h-full object-cover opacity-80"
                />
              )}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-stone-900/80 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                CAM REC
              </div>
              <div className="absolute bottom-1.5 right-1.5 text-[9px] text-stone-300 bg-stone-900/80 px-1.5 py-0.2 rounded font-mono">
                Face Verified
              </div>
            </div>
          </div>

          {/* Action Punch Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleClockInAction}
              disabled={!!activeRecord || isPhotoCapturing}
              className={`py-4 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 touch-target ${
                !activeRecord
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>{isPhotoCapturing ? 'Verifying...' : 'Clock In (Take Photo)'}</span>
            </button>

            <button
              onClick={handleClockOutAction}
              disabled={!activeRecord}
              className={`py-4 rounded-xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 touch-target ${
                activeRecord
                  ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer active:scale-98'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Clock Out</span>
            </button>
          </div>
        </div>

        {/* Right: Touch Employee Switcher */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Staff Quick Select
            </span>
            <span className="text-[10px] text-stone-400 font-bold">Touch to Switch</span>
          </div>

          <div className="space-y-2">
            {employeeDirectory.map((emp) => {
              const isSelected = emp.name === selectedEmployeeName
              const isClocked = attendanceRecords.some((a) => a.employeeName === emp.name && !a.clockOut)

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployeeName(emp.name)
                    setSelectedRole(emp.role)
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">{emp.name}</span>
                      <span className="text-[10px] text-stone-500">{emp.role}</span>
                    </div>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full ${
                      isClocked ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
                    }`}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Daily Attendance Logs Table */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              Today's Employee Attendance Verification Log
            </h3>
            <p className="text-xs text-stone-500">Photo-verified clock-in and clock-out audit trail</p>
          </div>
          <span className="text-xs text-stone-400 font-bold">{attendanceRecords.length} Punches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
              <tr>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Clock In</th>
                <th className="py-3 px-3">Clock Out</th>
                <th className="py-3 px-3">Photo Snapshot</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {attendanceRecords.map((att) => (
                <tr key={att.id} className="hover:bg-stone-50/70">
                  <td className="py-3 px-3 font-bold text-stone-900">{att.employeeName}</td>
                  <td className="py-3 px-3 text-stone-600">{att.role}</td>
                  <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">{att.date}</td>
                  <td className="py-3 px-3 font-extrabold text-emerald-700">{att.clockIn}</td>
                  <td className="py-3 px-3 font-extrabold text-stone-800">
                    {att.clockOut || <span className="text-amber-600 font-semibold italic">On Shift</span>}
                  </td>
                  <td className="py-3 px-3">
                    {att.photoUrl && (
                      <img
                        src={att.photoUrl}
                        alt="Verification"
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-stone-200"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full capitalize">
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
