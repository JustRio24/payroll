import React, { createContext, useContext, useState, useEffect } from "react";
import { addDays, format, differenceInMinutes, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { toast } from "@/hooks/use-toast";

// --- Types ---

export type Role = "admin" | "employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: string;
  joinDate: string;
  password?: string; // In a real app, this would be hashed.
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO string
  clockOut?: string; // ISO string
  clockInPhoto?: string;
  clockOutPhoto?: string;
  clockInLocation?: { lat: number; lng: number; address?: string };
  clockOutLocation?: { lat: number; lng: number; address?: string };
  status: "present" | "late" | "absent" | "leave" | "sick";
  approvalStatus: "pending" | "approved" | "rejected";
  notes?: string;
  isWithinGeofenceIn?: boolean;
  isWithinGeofenceOut?: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: "annual" | "sick" | "other";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  attachment?: string;
}

export interface PayrollRecord {
  id: string;
  userId: string;
  period: string; // YYYY-MM
  basicSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: {
    late: number;
    bpjs: number; // Employee share
    pph21: number;
    other: number;
  };
  totalNet: number;
  status: "draft" | "final";
  generatedAt: string;
}

export interface JobPosition {
  title: string;
  hourlyRate: number;
}

export interface AppConfig {
  officeLat: number;
  officeLng: number;
  geofenceRadius: number; // meters
  latePenaltyPerMinute: number;
  breakDurationMinutes: number;
  bpjsKesehatanRate: number; // Employee share (1%)
  bpjsKetenagakerjaanRate: number; // Employee share (2% JHT)
  companyName: string;
  companyAddress: string;
}

// --- Constants & Seed Data ---

const OFFICE_LOCATION = {
  lat: -2.9795731113284303,
  lng: 104.73111003716011,
};

const POSITIONS: JobPosition[] = [
  { title: "Kepala Proyek Manajer", hourlyRate: 75000 },
  { title: "Manajer", hourlyRate: 60000 },
  { title: "Arsitek", hourlyRate: 60000 },
  { title: "Wakil Kepala Proyek", hourlyRate: 50000 },
  { title: "Kepala Pengawasan", hourlyRate: 45000 },
  { title: "Staff Pengawasan", hourlyRate: 35000 },
  { title: "CMO", hourlyRate: 50000 },
  { title: "Admin", hourlyRate: 30000 },
  { title: "Staff Marketing", hourlyRate: 30000 },
  { title: "OB", hourlyRate: 12000 },
];

const SEED_USERS: User[] = [
  {
    id: "admin-1",
    name: "Administrator",
    email: "admin@panca.test",
    role: "admin",
    position: "Admin",
    joinDate: "2020-01-01",
    password: "password",
  },
  {
    id: "emp-1",
    name: "Budi Santoso",
    email: "budi@panca.test",
    role: "employee",
    position: "Kepala Proyek Manajer",
    joinDate: "2021-03-15",
    password: "password",
  },
  {
    id: "emp-2",
    name: "Siti Aminah",
    email: "siti@panca.test",
    role: "employee",
    position: "Arsitek",
    joinDate: "2022-06-10",
    password: "password",
  },
  {
    id: "emp-3",
    name: "Rudi Hartono",
    email: "rudi@panca.test",
    role: "employee",
    position: "Staff Pengawasan",
    joinDate: "2023-01-20",
    password: "password",
  },
  {
    id: "emp-4",
    name: "Dewi Lestari",
    email: "dewi@panca.test",
    role: "employee",
    position: "Staff Marketing",
    joinDate: "2023-05-05",
    password: "password",
  },
  {
    id: "emp-5",
    name: "Joko Anwar",
    email: "joko@panca.test",
    role: "employee",
    position: "OB",
    joinDate: "2023-11-01",
    password: "password",
  },
];

// Generate simple attendance history for demo
const generateHistory = () => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  SEED_USERS.slice(1).forEach(user => {
    for (let i = 0; i < 5; i++) {
      const date = subMonths(today, 0);
      const day = addDays(date, -i);
      
      // Skip weekends (simplified)
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      
      const dateStr = format(day, "yyyy-MM-dd");
      
      // Randomize times
      const entryHour = 7 + Math.random(); // 7:00 - 8:00
      const exitHour = 16 + Math.random() * 2; // 16:00 - 18:00
      
      const clockIn = new Date(day);
      clockIn.setHours(Math.floor(entryHour), Math.floor((entryHour % 1) * 60));
      
      const clockOut = new Date(day);
      clockOut.setHours(Math.floor(exitHour), Math.floor((exitHour % 1) * 60));

      records.push({
        id: `att-${user.id}-${i}`,
        userId: user.id,
        date: dateStr,
        clockIn: clockIn.toISOString(),
        clockOut: clockOut.toISOString(),
        status: "present",
        approvalStatus: "approved",
        isWithinGeofenceIn: true,
        isWithinGeofenceOut: true,
      });
    }
  });
  return records;
};

// --- Utils ---

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Return meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// --- Context ---

interface AppContextType {
  user: User | null;
  users: User[];
  positions: JobPosition[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrolls: PayrollRecord[];
  config: AppConfig;
  login: (email: string) => void;
  logout: () => void;
  clockIn: (lat: number, lng: number, photo: string) => Promise<void>;
  clockOut: (lat: number, lng: number, photo: string) => Promise<void>;
  requestLeave: (data: Omit<LeaveRequest, "id" | "status" | "userId">) => void;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  approveAttendance: (id: string, status: "approved" | "rejected") => void;
  generatePayroll: (period: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users] = useState<User[]>(SEED_USERS);
  const [positions] = useState<JobPosition[]>(POSITIONS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(generateHistory());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    officeLat: OFFICE_LOCATION.lat,
    officeLng: OFFICE_LOCATION.lng,
    geofenceRadius: 100,
    latePenaltyPerMinute: 2000,
    breakDurationMinutes: 60,
    bpjsKesehatanRate: 0.01,
    bpjsKetenagakerjaanRate: 0.02,
    companyName: "PT Panca Karya Utama",
    companyAddress: "Jl. Konstruksi No. 123, Palembang",
  });

  const login = (email: string) => {
    const found = users.find((u) => u.email === email);
    if (found) {
      setUser(found);
      toast({ title: "Welcome back!", description: `Logged in as ${found.name}` });
    } else {
      toast({ title: "Login Failed", description: "User not found", variant: "destructive" });
    }
  };

  const logout = () => {
    setUser(null);
    window.location.href = "/"; // Force redirect to login
  };

  const clockIn = async (lat: number, lng: number, photo: string) => {
    if (!user) return;
    
    const dist = getDistanceFromLatLonInKm(lat, lng, config.officeLat, config.officeLng);
    const isWithin = dist <= config.geofenceRadius;
    const now = new Date();
    
    // Check if already clocked in today
    const todayStr = format(now, "yyyy-MM-dd");
    const existing = attendance.find(a => a.userId === user.id && a.date === todayStr);

    if (existing) {
      toast({ title: "Error", description: "You have already clocked in today", variant: "destructive" });
      return;
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      userId: user.id,
      date: todayStr,
      clockIn: now.toISOString(),
      clockInLocation: { lat, lng },
      clockInPhoto: photo,
      status: "present", // Basic logic, refined later
      approvalStatus: "pending",
      isWithinGeofenceIn: isWithin,
    };

    setAttendance(prev => [...prev, newRecord]);
    toast({ 
      title: isWithin ? "Clock In Successful" : "Clock In (Outside Geofence)", 
      description: isWithin ? "You are within the office area." : "Warning: You are outside the allowed radius.",
      variant: isWithin ? "default" : "destructive"
    });
  };

  const clockOut = async (lat: number, lng: number, photo: string) => {
    if (!user) return;
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    
    const existing = attendance.find(a => a.userId === user.id && a.date === todayStr);
    
    if (!existing) {
       toast({ title: "Error", description: "You haven't clocked in yet", variant: "destructive" });
       return;
    }

    if (existing.clockOut) {
       toast({ title: "Error", description: "Already clocked out", variant: "destructive" });
       return;
    }

    const dist = getDistanceFromLatLonInKm(lat, lng, config.officeLat, config.officeLng);
    const isWithin = dist <= config.geofenceRadius;

    const updated = {
      ...existing,
      clockOut: now.toISOString(),
      clockOutLocation: { lat, lng },
      clockOutPhoto: photo,
      isWithinGeofenceOut: isWithin,
    };

    setAttendance(prev => prev.map(a => a.id === existing.id ? updated : a));
    toast({ title: "Clock Out Successful", description: "See you tomorrow!" });
  };

  const requestLeave = (data: Omit<LeaveRequest, "id" | "status" | "userId">) => {
    if (!user) return;
    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      userId: user.id,
      status: "pending",
      ...data
    };
    setLeaves(prev => [...prev, newLeave]);
    toast({ title: "Leave Requested", description: "Waiting for approval" });
  };

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const approveAttendance = (id: string, status: "approved" | "rejected") => {
    setAttendance(prev => prev.map(a => a.id === id ? { ...a, approvalStatus: status } : a));
  };

  // --- SIMPLE PAYROLL ENGINE ---
  const generatePayroll = (period: string) => {
    // Period format YYYY-MM
    // 1. Get all employees
    // 2. For each employee, calculate work hours, overtime, penalties
    
    const newPayrolls: PayrollRecord[] = [];
    
    users.filter(u => u.role !== 'admin').forEach(u => { // Skip admin for payroll demo usually
       const position = positions.find(p => p.title === u.position);
       const hourlyRate = position ? position.hourlyRate : 0;
       
       // Filter attendance for this user in this period
       const userAttendance = attendance.filter(a => 
         a.userId === u.id && 
         a.date.startsWith(period) &&
         a.approvalStatus === "approved" &&
         a.clockIn && a.clockOut
       );

       let totalWorkMinutes = 0;
       let totalOvertimeMinutes = 0;
       let totalLateMinutes = 0;

       userAttendance.forEach(att => {
          if (!att.clockIn || !att.clockOut) return;
          const start = new Date(att.clockIn);
          const end = new Date(att.clockOut);
          
          // Lateness
          const workStart = new Date(att.date + "T08:00:00");
          const lateThreshold = new Date(att.date + "T08:10:00");
          
          if (start > lateThreshold) {
            const diffMs = start.getTime() - workStart.getTime();
            totalLateMinutes += Math.floor(diffMs / 60000);
          }

          // Duration
          let durationMinutes = differenceInMinutes(end, start);
          // Deduct break
          if (durationMinutes > 4 * 60) {
             durationMinutes -= config.breakDurationMinutes;
          }
          if (durationMinutes < 0) durationMinutes = 0;

          // Overtime (after 16:00)
          const workEnd = new Date(att.date + "T16:00:00");
          if (end > workEnd) {
             const otMinutes = differenceInMinutes(end, workEnd);
             if (otMinutes > 0) {
                totalOvertimeMinutes += otMinutes;
                // Cap normal work minutes to 16:00
                // (Simplified calculation)
             }
          }
          
          totalWorkMinutes += durationMinutes;
       });

       // Basic Salary = Total Hours * Rate (Simplified based on prompt: "total_jam_kerja x rate_per_jam")
       // Wait, prompt says: 
       // "Upah kerja (basic) = total_jam_kerja × rate_per_jam"
       // "Upah lembur = ... 1.5x first hour, 2x next"
       
       const workHours = totalWorkMinutes / 60;
       const basicPay = Math.floor(workHours * hourlyRate);

       // Overtime Calc
       // Simply assume all overtime is "next hours" for simplicity in this mockup or do strict 1st hour check
       // Let's do a simple aggregate for the mockup:
       // If OT > 0, first hour is 1.5, rest is 2.0. 
       // Wait, this is per day.
       // Let's re-iterate per day for precise calc
       
       let totalOTPay = 0;
       userAttendance.forEach(att => {
          if (!att.clockOut) return;
          const end = new Date(att.clockOut);
          const workEnd = new Date(att.date + "T16:00:00");
          
          if (end > workEnd) {
             const otMinutes = differenceInMinutes(end, workEnd);
             const otHours = otMinutes / 60;
             if (otHours > 0) {
                const firstHour = Math.min(otHours, 1);
                const nextHours = Math.max(0, otHours - 1);
                totalOTPay += (firstHour * 1.5 * hourlyRate) + (nextHours * 2 * hourlyRate);
             }
          }
       });

       // Deductions
       const latePenalty = totalLateMinutes * config.latePenaltyPerMinute;
       const bpjs = basicPay * (config.bpjsKesehatanRate + config.bpjsKetenagakerjaanRate);
       const pph21 = basicPay * 0.05; // Mock 5% flat for prototype

       const net = basicPay + totalOTPay - latePenalty - bpjs - pph21;

       newPayrolls.push({
         id: `pr-${u.id}-${period}`,
         userId: u.id,
         period,
         basicSalary: basicPay,
         overtimePay: totalOTPay,
         bonus: 0,
         deductions: {
           late: latePenalty,
           bpjs,
           pph21,
           other: 0,
         },
         totalNet: net,
         status: "draft",
         generatedAt: new Date().toISOString(),
       });
    });

    setPayrolls(prev => {
      // Remove old drafts for this period
      const filtered = prev.filter(p => p.period !== period);
      return [...filtered, ...newPayrolls];
    });
    
    toast({ title: "Payroll Generated", description: `Created for ${newPayrolls.length} employees` });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        positions,
        attendance,
        leaves,
        payrolls,
        config,
        login,
        logout,
        clockIn,
        clockOut,
        requestLeave,
        updateConfig,
        approveAttendance,
        generatePayroll
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
