import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { FileText, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReports() {
  const { payrolls, users, attendance } = useApp();
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));

  const filteredPayrolls = payrolls.filter(p => p.period === period);
  const filteredAttendance = attendance.filter(a => a.date.startsWith(period));

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  const exportPayrollPDF = () => {
    const doc = new jsPDF();
    doc.text(`Payroll Recap - ${period}`, 14, 15);
    
    const data = filteredPayrolls.map(p => {
       const u = users.find(x => x.id === p.userId);
       return [
         u?.name || "Unknown",
         u?.position || "-",
         formatIDR(p.basicSalary),
         formatIDR(p.overtimePay),
         formatIDR(Object.values(p.deductions).reduce((a,b)=>a+b,0)),
         formatIDR(p.totalNet)
       ];
    });

    autoTable(doc, {
       head: [['Employee', 'Position', 'Basic', 'Overtime', 'Deductions', 'Net Salary']],
       body: data,
       startY: 20
    });

    doc.save(`payroll_report_${period}.pdf`);
  };

  const exportAttendancePDF = () => {
    const doc = new jsPDF();
    doc.text(`Attendance Recap - ${period}`, 14, 15);
    
    const data = filteredAttendance.map(a => {
       const u = users.find(x => x.id === a.userId);
       return [
         u?.name || "Unknown",
         a.date,
         a.clockIn ? format(new Date(a.clockIn), "HH:mm") : "-",
         a.clockOut ? format(new Date(a.clockOut), "HH:mm") : "-",
         a.status,
         a.isWithinGeofenceIn ? "Yes" : "No"
       ];
    });

    autoTable(doc, {
       head: [['Employee', 'Date', 'In', 'Out', 'Status', 'In Zone']],
       body: data,
       startY: 20
    });

    doc.save(`attendance_report_${period}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Reports</h2>
          <p className="text-slate-500">Generate and export system data</p>
        </div>
        
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }).map((_, i) => {
              const date = subMonths(new Date(), i);
              const val = format(date, "yyyy-MM");
              return <SelectItem key={val} value={val}>{format(date, "MMMM yyyy")}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Payroll Report</CardTitle>
            <CardDescription>Summary of salaries, deductions, and net pay for {format(new Date(period), "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-50 rounded-lg mb-6 border border-slate-100">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm text-slate-500">Total Records</span>
                 <span className="font-medium">{filteredPayrolls.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-500">Total Payout</span>
                 <span className="font-bold text-slate-900">{formatIDR(filteredPayrolls.reduce((a,b) => a + b.totalNet, 0))}</span>
               </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={exportPayrollPDF} className="flex-1 bg-slate-900">
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
              <Button variant="outline" className="flex-1">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Report</CardTitle>
            <CardDescription>Log of employee presence and lateness for {format(new Date(period), "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="p-4 bg-slate-50 rounded-lg mb-6 border border-slate-100">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm text-slate-500">Total Logs</span>
                 <span className="font-medium">{filteredAttendance.length}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-slate-500">Late Arrivals</span>
                 <span className="font-medium text-orange-600">{filteredAttendance.filter(a => a.status === 'late').length}</span>
               </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={exportAttendancePDF} className="flex-1 bg-slate-900">
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
              <Button variant="outline" className="flex-1">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
