import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertPositionSchema, 
  insertAttendanceSchema,
  insertLeaveSchema,
  insertPayrollSchema 
} from "@shared/schema";

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

// Validation middleware
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: "Validation failed", 
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    } else {
      next(error);
    }
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============================================
  // AUTH ROUTES
  // ============================================
  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }));

  // ============================================
  // USERS ROUTES
  // ============================================
  app.get("/api/users", asyncHandler(async (req, res) => {
    const users = await storage.getUsers();
    // Remove passwords from response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  }));

  app.get("/api/users/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }));

  app.post("/api/users", asyncHandler(async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(validatedData.email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const user = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      throw error;
    }
  }));

  app.patch("/api/users/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await storage.updateUser(id, req.body);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  }));

  app.delete("/api/users/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const success = await storage.deleteUser(id);
    if (!success) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  }));

  // ============================================
  // POSITIONS ROUTES
  // ============================================
  app.get("/api/positions", asyncHandler(async (req, res) => {
    const positions = await storage.getPositions();
    res.json(positions);
  }));

  app.get("/api/positions/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid position ID" });
    }

    const position = await storage.getPosition(id);
    if (!position) {
      return res.status(404).json({ error: "Position not found" });
    }

    res.json(position);
  }));

  app.post("/api/positions", asyncHandler(async (req, res) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const position = await storage.createPosition(validatedData);
      res.status(201).json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      throw error;
    }
  }));

  app.patch("/api/positions/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid position ID" });
    }

    const position = await storage.updatePosition(id, req.body);
    if (!position) {
      return res.status(404).json({ error: "Position not found" });
    }

    res.json(position);
  }));

  app.delete("/api/positions/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid position ID" });
    }

    const success = await storage.deletePosition(id);
    if (!success) {
      return res.status(404).json({ error: "Position not found" });
    }

    res.json({ success: true, message: "Position deleted successfully" });
  }));

  // ============================================
  // ATTENDANCE ROUTES
  // ============================================
  app.get("/api/attendance", asyncHandler(async (req, res) => {
    const { userId, date } = req.query;
    
    if (userId) {
      const records = await storage.getAttendanceByUser(parseInt(userId as string));
      return res.json(records);
    }
    
    if (date) {
      const records = await storage.getAttendanceByDate(date as string);
      return res.json(records);
    }

    const records = await storage.getAttendanceRecords();
    res.json(records);
  }));

  app.get("/api/attendance/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid attendance ID" });
    }

    const record = await storage.getAttendance(id);
    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json(record);
  }));

  app.post("/api/attendance", asyncHandler(async (req, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const record = await storage.createAttendance(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      throw error;
    }
  }));

  app.patch("/api/attendance/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid attendance ID" });
    }

    const record = await storage.updateAttendance(id, req.body);
    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json(record);
  }));

  app.delete("/api/attendance/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid attendance ID" });
    }

    const success = await storage.deleteAttendance(id);
    if (!success) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    res.json({ success: true, message: "Attendance record deleted successfully" });
  }));

  // Clock In endpoint
  app.post("/api/attendance/clock-in", asyncHandler(async (req, res) => {
    const { userId, lat, lng, photo } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if already clocked in today
    const existingRecords = await storage.getAttendanceByUser(userId);
    const todayRecord = existingRecords.find(r => {
      const recordDate = r.date instanceof Date 
        ? r.date.toISOString().split('T')[0]
        : String(r.date).split('T')[0];
      return recordDate === today;
    });

    if (todayRecord) {
      return res.status(400).json({ error: "Already clocked in today" });
    }

    // Get config for geofence check and late calculation
    const configs = await storage.getConfigs();
    const getConfig = (key: string, defaultVal: string) => 
      configs.find(c => c.key === key)?.value || defaultVal;

    const officeLat = parseFloat(getConfig('officeLat', '-2.9795731113284303'));
    const officeLng = parseFloat(getConfig('officeLng', '104.73111003716011'));
    const geofenceRadius = parseFloat(getConfig('geofenceRadius', '100'));
    const workStartTime = getConfig('work_start_time', '08:00');
    const lateToleranceMinutes = parseInt(getConfig('late_tolerance_minutes', '10'));

    // Calculate distance
    const distance = getDistanceFromLatLonInMeters(lat, lng, officeLat, officeLng);
    const isWithinGeofence = distance <= geofenceRadius;

    // Calculate late minutes
    const now = new Date();
    const workStart = new Date(today + 'T' + workStartTime + ':00');
    const lateThreshold = new Date(workStart.getTime() + lateToleranceMinutes * 60000);
    
    let lateMinutes = 0;
    let status = "present";
    
    if (now > lateThreshold) {
      lateMinutes = Math.floor((now.getTime() - workStart.getTime()) / 60000);
      status = "late";
    }

    const record = await storage.createAttendance({
      userId,
      date: new Date(today),
      clockIn: now,
      clockInLat: lat?.toString(),
      clockInLng: lng?.toString(),
      clockInPhoto: photo,
      status,
      approvalStatus: "pending",
      isWithinGeofenceIn: isWithinGeofence,
      lateMinutes,
    });

    // Create activity log for clock-in
    await storage.createActivityLog({
      userId,
      activityType: 'clock_in',
      description: 'Clock In',
      metadata: JSON.stringify({
        status,
        isWithinGeofence,
        lateMinutes,
      }),
    });

    res.status(201).json(record);
  }));

  // Clock Out endpoint
  app.post("/api/attendance/clock-out", asyncHandler(async (req, res) => {
    const { userId, lat, lng, photo } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Find today's record
    const existingRecords = await storage.getAttendanceByUser(userId);
    const todayRecord = existingRecords.find(r => {
      const recordDate = r.date instanceof Date 
        ? r.date.toISOString().split('T')[0]
        : String(r.date).split('T')[0];
      return recordDate === today;
    });

    if (!todayRecord) {
      return res.status(400).json({ error: "No clock in record found for today" });
    }

    if (todayRecord.clockOut) {
      return res.status(400).json({ error: "Already clocked out today" });
    }

    // Get config for geofence check and overtime calculation
    const configs = await storage.getConfigs();
    const getConfig = (key: string, defaultVal: string) => 
      configs.find(c => c.key === key)?.value || defaultVal;

    const officeLat = parseFloat(getConfig('officeLat', '-2.9795731113284303'));
    const officeLng = parseFloat(getConfig('officeLng', '104.73111003716011'));
    const geofenceRadius = parseFloat(getConfig('geofenceRadius', '100'));
    const workEndTime = getConfig('work_end_time', '16:00');

    const distance = getDistanceFromLatLonInMeters(lat, lng, officeLat, officeLng);
    const isWithinGeofence = distance <= geofenceRadius;

    // Calculate overtime minutes
    const now = new Date();
    const workEnd = new Date(today + 'T' + workEndTime + ':00');
    let overtimeMinutes = 0;
    
    if (now > workEnd) {
      overtimeMinutes = Math.floor((now.getTime() - workEnd.getTime()) / 60000);
    }

    const record = await storage.updateAttendance(todayRecord.id, {
      clockOut: now,
      clockOutLat: lat?.toString(),
      clockOutLng: lng?.toString(),
      clockOutPhoto: photo,
      isWithinGeofenceOut: isWithinGeofence,
      overtimeMinutes,
    });

    // Create activity log for clock-out
    await storage.createActivityLog({
      userId,
      activityType: 'clock_out',
      description: 'Clock Out',
      metadata: JSON.stringify({
        isWithinGeofence,
        overtimeMinutes,
      }),
    });

    res.json(record);
  }));

  // ============================================
  // LEAVES ROUTES
  // ============================================
  app.get("/api/leaves", asyncHandler(async (req, res) => {
    const { userId } = req.query;
    
    if (userId) {
      const leaves = await storage.getLeavesByUser(parseInt(userId as string));
      return res.json(leaves);
    }

    const leaves = await storage.getLeaves();
    res.json(leaves);
  }));

  app.get("/api/leaves/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid leave ID" });
    }

    const leave = await storage.getLeave(id);
    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json(leave);
  }));

  app.post("/api/leaves", asyncHandler(async (req, res) => {
    try {
      const validatedData = insertLeaveSchema.parse(req.body);
      const leave = await storage.createLeave(validatedData);
      res.status(201).json(leave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      throw error;
    }
  }));

  app.patch("/api/leaves/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid leave ID" });
    }

    const leave = await storage.updateLeave(id, req.body);
    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json(leave);
  }));

  app.delete("/api/leaves/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid leave ID" });
    }

    const success = await storage.deleteLeave(id);
    if (!success) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json({ success: true, message: "Leave request deleted successfully" });
  }));

  // Approve/Reject leave
  app.post("/api/leaves/:id/approve", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { status, approvedBy } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    const leave = await storage.updateLeave(id, { 
      status, 
      approvedBy
    });

    if (!leave) {
      return res.status(404).json({ error: "Leave request not found" });
    }

    res.json(leave);
  }));

  // ============================================
  // PAYROLL ROUTES
  // ============================================
  app.get("/api/payroll", asyncHandler(async (req, res) => {
    const { period, userId } = req.query;
    
    if (period) {
      const payrolls = await storage.getPayrollsByPeriod(period as string);
      return res.json(payrolls);
    }
    
    if (userId) {
      const payrolls = await storage.getPayrollsByUser(parseInt(userId as string));
      return res.json(payrolls);
    }

    const payrolls = await storage.getPayrolls();
    res.json(payrolls);
  }));

  app.get("/api/payroll/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid payroll ID" });
    }

    const payroll = await storage.getPayroll(id);
    if (!payroll) {
      return res.status(404).json({ error: "Payroll record not found" });
    }

    res.json(payroll);
  }));

  app.post("/api/payroll", asyncHandler(async (req, res) => {
    try {
      const validatedData = insertPayrollSchema.parse(req.body);
      const payroll = await storage.createPayroll(validatedData);
      res.status(201).json(payroll);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors 
        });
      }
      throw error;
    }
  }));

  // Generate payroll for a period
  app.post("/api/payroll/generate", asyncHandler(async (req, res) => {
    const { period, manualBonuses } = req.body;
    
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ error: "Valid period (YYYY-MM) required" });
    }

    // Delete existing drafts for this period
    await storage.deletePayrollsByPeriod(period);

    // Get all employees
    const users = await storage.getUsers();
    const employees = users.filter(u => u.role !== 'admin');

    // Get positions for hourly rates
    const positions = await storage.getPositions();

    // Get config with defaults
    const configs = await storage.getConfigs();
    const getConfig = (key: string, defaultVal: string) => 
      configs.find(c => c.key === key)?.value || defaultVal;

    // Work schedule config
    const workStartTime = getConfig('work_start_time', '08:00');
    const workEndTime = getConfig('work_end_time', '16:00');
    const lateToleranceMinutes = parseInt(getConfig('late_tolerance_minutes', '10'));
    
    // Overtime rates
    const overtimeRateFirst = parseFloat(getConfig('overtime_rate_first_hour', '1.5'));
    const overtimeRateNext = parseFloat(getConfig('overtime_rate_next_hours', '2.0'));
    
    // Deduction rates
    const latePenaltyPerMinute = parseInt(getConfig('late_penalty_per_minute', '2000'));
    const bpjsKesehatanRate = parseFloat(getConfig('bpjs_kesehatan_rate', '0.01'));
    const bpjsKetenagakerjaanRate = parseFloat(getConfig('bpjs_ketenagakerjaan_rate', '0.02'));
    const pph21Rate = parseFloat(getConfig('pph21_rate', '0.05'));

    const payrolls = [];

    for (const emp of employees) {
      const position = positions.find(p => p.id === emp.positionId);
      const hourlyRate = position?.hourlyRate || 0;

      // Get attendance for this period
      const allAttendance = await storage.getAttendanceByUser(emp.id);
      const periodAttendance = allAttendance.filter(a => {
        const recordDate = a.date instanceof Date 
          ? a.date.toISOString().substring(0, 7)
          : String(a.date).substring(0, 7);
        return recordDate === period && a.approvalStatus === 'approved' && a.clockIn && a.clockOut;
      });

      let totalWorkMinutes = 0;
      let totalLateMinutes = 0;
      let totalOvertimeMinutes = 0;

      for (const att of periodAttendance) {
        if (!att.clockIn || !att.clockOut) continue;

        const clockIn = new Date(att.clockIn);
        const clockOut = new Date(att.clockOut);
        const dateStr = att.date instanceof Date 
          ? att.date.toISOString().split('T')[0]
          : String(att.date).split('T')[0];

        // Use stored late minutes if available, otherwise calculate
        if (att.lateMinutes !== undefined && att.lateMinutes !== null) {
          totalLateMinutes += att.lateMinutes;
        } else {
          // Calculate late minutes from config
          const workStart = new Date(dateStr + 'T' + workStartTime + ':00');
          const lateThreshold = new Date(workStart.getTime() + lateToleranceMinutes * 60000);
          
          if (clockIn > lateThreshold) {
            totalLateMinutes += Math.floor((clockIn.getTime() - workStart.getTime()) / 60000);
          }
        }

        // Calculate work duration
        let durationMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / 60000);
        if (durationMinutes > 240) durationMinutes -= 60; // Deduct 1 hour break
        if (durationMinutes < 0) durationMinutes = 0;
        totalWorkMinutes += durationMinutes;

        // Use stored overtime minutes if available, otherwise calculate
        if (att.overtimeMinutes !== undefined && att.overtimeMinutes !== null) {
          totalOvertimeMinutes += att.overtimeMinutes;
        } else {
          // Calculate overtime from config
          const workEnd = new Date(dateStr + 'T' + workEndTime + ':00');
          if (clockOut > workEnd) {
            totalOvertimeMinutes += Math.floor((clockOut.getTime() - workEnd.getTime()) / 60000);
          }
        }
      }

      // Calculate overtime pay using configurable rates
      const otHours = totalOvertimeMinutes / 60;
      let totalOvertimePay = 0;
      if (otHours > 0) {
        const firstHour = Math.min(otHours, 1);
        const nextHours = Math.max(0, otHours - 1);
        totalOvertimePay = Math.floor((firstHour * overtimeRateFirst * hourlyRate) + (nextHours * overtimeRateNext * hourlyRate));
      }

      // Calculate salary
      const workHours = totalWorkMinutes / 60;
      const basicSalary = Math.floor(workHours * hourlyRate);
      const lateDeduction = totalLateMinutes * latePenaltyPerMinute;
      const bpjsDeduction = Math.floor(basicSalary * (bpjsKesehatanRate + bpjsKetenagakerjaanRate));
      const pph21Deduction = Math.floor(basicSalary * pph21Rate);
      
      // Get manual bonus for this employee if provided
      const manualBonus = manualBonuses?.[emp.id] || 0;
      
      const totalNet = basicSalary + totalOvertimePay + manualBonus - lateDeduction - bpjsDeduction - pph21Deduction;

      const payroll = await storage.createPayroll({
        userId: emp.id,
        period,
        basicSalary,
        overtimePay: totalOvertimePay,
        bonus: manualBonus,
        lateDeduction,
        bpjsDeduction,
        pph21Deduction,
        otherDeduction: 0,
        totalNet,
        status: 'draft',
      });

      payrolls.push(payroll);
    }

    res.status(201).json({ 
      success: true, 
      message: `Generated payroll for ${payrolls.length} employees`,
      payrolls 
    });
  }));

  app.patch("/api/payroll/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid payroll ID" });
    }

    const payroll = await storage.updatePayroll(id, req.body);
    if (!payroll) {
      return res.status(404).json({ error: "Payroll record not found" });
    }

    res.json(payroll);
  }));

  // Finalize payroll
  app.post("/api/payroll/:id/finalize", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    
    const payroll = await storage.updatePayroll(id, { 
      status: 'final'
    });

    if (!payroll) {
      return res.status(404).json({ error: "Payroll record not found" });
    }

    res.json(payroll);
  }));

  app.delete("/api/payroll/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid payroll ID" });
    }

    const success = await storage.deletePayroll(id);
    if (!success) {
      return res.status(404).json({ error: "Payroll record not found" });
    }

    res.json({ success: true, message: "Payroll record deleted successfully" });
  }));

  // ============================================
  // CONFIG ROUTES
  // ============================================
  app.get("/api/config", asyncHandler(async (req, res) => {
    const configs = await storage.getConfigs();
    
    // Convert to object format
    const configObj: Record<string, string> = {};
    configs.forEach(c => {
      configObj[c.key] = c.value || '';
    });
    
    res.json(configObj);
  }));

  app.get("/api/config/:key", asyncHandler(async (req, res) => {
    const config = await storage.getConfigByKey(req.params.key);
    if (!config) {
      return res.status(404).json({ error: "Config key not found" });
    }
    res.json(config);
  }));

  app.post("/api/config", asyncHandler(async (req, res) => {
    const { key, value, description } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: "Config key required" });
    }

    const config = await storage.setConfig(key, value || '', description);
    res.json(config);
  }));

  app.post("/api/config/bulk", asyncHandler(async (req, res) => {
    const configs = req.body;
    
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ error: "Config object required" });
    }

    const results = [];
    for (const [key, value] of Object.entries(configs)) {
      const config = await storage.setConfig(key, String(value));
      results.push(config);
    }

    res.json({ success: true, configs: results });
  }));

  app.delete("/api/config/:key", asyncHandler(async (req, res) => {
    const success = await storage.deleteConfig(req.params.key);
    if (!success) {
      return res.status(404).json({ error: "Config key not found" });
    }
    res.json({ success: true, message: "Config deleted successfully" });
  }));

  // ============================================
  // ACTIVITY LOGS ROUTES
  // ============================================
  app.get("/api/activity-logs", asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await storage.getActivityLogs(limit);
    res.json(logs);
  }));

  app.post("/api/activity-logs", asyncHandler(async (req, res) => {
    const { userId, activityType, description, metadata } = req.body;
    
    if (!userId || !activityType) {
      return res.status(400).json({ error: "userId and activityType required" });
    }

    const log = await storage.createActivityLog({
      userId,
      activityType,
      description,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    res.status(201).json(log);
  }));

  // ============================================
  // DASHBOARD STATS
  // ============================================
  app.get("/api/dashboard/stats", asyncHandler(async (req, res) => {
    const users = await storage.getUsers();
    const attendance = await storage.getAttendanceRecords();
    const leaves = await storage.getLeaves();

    const today = new Date().toISOString().split('T')[0];
    const employees = users.filter(u => u.role !== 'admin');
    
    const todayAttendance = attendance.filter(a => {
      const recordDate = a.date instanceof Date 
        ? a.date.toISOString().split('T')[0]
        : String(a.date).split('T')[0];
      return recordDate === today;
    });

    res.json({
      totalEmployees: employees.length,
      presentToday: todayAttendance.filter(a => a.status === 'present').length,
      lateToday: todayAttendance.filter(a => a.status === 'late').length,
      pendingApprovals: attendance.filter(a => a.approvalStatus === 'pending').length,
      pendingLeaves: leaves.filter(l => l.status === 'pending').length,
    });
  }));

  // ============================================
  // RECENT ACTIVITY ENDPOINT (Realtime)
  // ============================================
  app.get("/api/dashboard/recent-activity", asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await storage.getUsers();
    
    // Try to get from activity_logs table first
    const activityLogs = await storage.getActivityLogs(limit);
    
    if (activityLogs && activityLogs.length > 0) {
      const activities = activityLogs.map(log => {
        const user = users.find(u => u.id === log.userId);
        const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
        return {
          id: log.id,
          type: log.activityType,
          userId: log.userId,
          userName: user?.name || 'Unknown',
          description: log.description,
          timestamp: log.createdAt,
          metadata: metadata || {}
        };
      });
      return res.json(activities);
    }

    // Fallback: derive from attendance and leaves for backward compatibility
    const attendance = await storage.getAttendanceRecords();
    const leaves = await storage.getLeaves();
    
    const activities: any[] = [];
    
    attendance.slice(0, 30).forEach(att => {
      const user = users.find(u => u.id === att.userId);
      if (att.clockIn) {
        activities.push({
          id: `att-in-${att.id}`,
          type: 'clock_in',
          userId: att.userId,
          userName: user?.name || 'Unknown',
          description: `Clock In`,
          timestamp: att.clockIn,
          metadata: { 
            status: att.status,
            isWithinGeofence: att.isWithinGeofenceIn,
            lateMinutes: att.lateMinutes || 0
          }
        });
      }
      if (att.clockOut) {
        activities.push({
          id: `att-out-${att.id}`,
          type: 'clock_out',
          userId: att.userId,
          userName: user?.name || 'Unknown',
          description: `Clock Out`,
          timestamp: att.clockOut,
          metadata: { 
            isWithinGeofence: att.isWithinGeofenceOut,
            overtimeMinutes: att.overtimeMinutes || 0
          }
        });
      }
    });

    leaves.slice(0, 10).forEach(leave => {
      const user = users.find(u => u.id === leave.userId);
      activities.push({
        id: `leave-${leave.id}`,
        type: 'leave_request',
        userId: leave.userId,
        userName: user?.name || 'Unknown',
        description: `Leave Request (${leave.type})`,
        timestamp: leave.createdAt || leave.startDate,
        metadata: { status: leave.status, type: leave.type }
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(activities.slice(0, limit));
  }));

  // ============================================
  // ERROR HANDLER
  // ============================================
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return httpServer;
}

// Utility function for geofence calculation
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
