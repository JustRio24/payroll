import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, FileText, MapPin } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function EmployeeDashboard() {
  const { user, attendance } = useApp();

  const myAttendance = attendance.filter(a => a.userId === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRecord = myAttendance.find(a => a.date === todayStr);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Welcome, {user?.name.split(" ")[0]}</h2>
           <p className="text-slate-500">Here is your daily overview</p>
         </div>
         <div className="text-right hidden sm:block">
           <p className="text-2xl font-bold font-mono text-slate-900">{format(new Date(), "HH:mm")}</p>
           <p className="text-sm text-slate-500">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
         </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 text-white border-none shadow-lg">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
             <div className="p-4 bg-white/10 rounded-full">
               <Clock className="w-8 h-8 text-orange-400" />
             </div>
             <div className="text-center">
               <h3 className="text-lg font-medium">Attendance Action</h3>
               <p className="text-slate-400 text-sm mb-4">
                 {todayRecord?.clockIn ? (todayRecord.clockOut ? "You have completed work today" : "You are clocked in") : "You haven't clocked in yet"}
               </p>
               <Link href="/employee/attendance">
                 <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold w-40">
                   {todayRecord?.clockIn ? (todayRecord.clockOut ? "View History" : "Clock Out") : "Clock In"}
                 </Button>
               </Link>
             </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-rows-2">
           <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <CardContent className="p-6 flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-sm font-medium text-slate-500">Leave Balance</p>
                 <p className="text-2xl font-bold text-slate-900">12 Days</p>
               </div>
               <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                 <CalendarCheck className="w-5 h-5" />
               </div>
             </CardContent>
           </Card>
           
           <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
             <CardContent className="p-6 flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-sm font-medium text-slate-500">Latest Payslip</p>
                 <p className="text-sm font-bold text-slate-900">November 2024</p>
               </div>
               <Link href="/employee/payslips">
                 <Button variant="outline" size="sm">View</Button>
               </Link>
             </CardContent>
           </Card>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myAttendance.slice(0, 5).map(att => (
              <div key={att.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-slate-100 rounded text-slate-500">
                     <CalendarCheck className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="font-medium text-slate-900">{format(new Date(att.date), "EEEE, d MMMM")}</p>
                     <p className="text-xs text-slate-500 flex items-center gap-1">
                       {att.clockIn ? format(new Date(att.clockIn), "HH:mm") : "-"} — {att.clockOut ? format(new Date(att.clockOut), "HH:mm") : "-"}
                       {att.isWithinGeofenceIn === false && <span className="text-red-500 ml-2 text-[10px] uppercase font-bold">(Outside)</span>}
                     </p>
                   </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded capitalize font-medium ${
                  att.status === 'present' ? 'bg-green-100 text-green-700' : 
                  att.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {att.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
