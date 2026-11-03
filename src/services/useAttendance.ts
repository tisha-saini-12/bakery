/**
 * Service Hook: useAttendance
 * Encapsulates staff PIN verification and photo snapshot clock in/out.
 */
import { useBakeryStore } from '../store/useBakeryStore'

export function useAttendance() {
  const { attendanceRecords, clockIn, clockOut } = useBakeryStore()

  return {
    attendanceRecords,
    clockIn: (
      employeeId: string,
      employeeName: string,
      role: string,
      locationId: string,
      photoUrl?: string
    ) => {
      return clockIn(employeeId, employeeName, role, locationId, photoUrl)
    },
    clockOut: (attendanceId: string) => {
      clockOut(attendanceId)
    },
  }
}
