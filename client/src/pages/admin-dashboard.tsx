import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CalendarCheck,
  TrendingUp
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from "date-fns";

export default function AdminDashboard() {
  const { users, attendance, payrolls } = useApp();

  const totalEmployees = users.length - 1; // Exclude admin
  
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  
  const presentCount = todayAttendance.filter(a => a.status === "present").length;
  const lateCount = todayAttendance.filter(a => a.status === "late" || (a.clockIn && new Date(a.clockIn).getHours() >= 8 && new Date(a.clockIn).getMinutes() > 10)).length;
  
  // Mock data for chart - last 7 days attendance
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dStr = format(d, "yyyy-MM-dd");
    const count = attendance.filter(a => a.date === dStr).length;
    return {
      name: format(d, "EEE"),
      present: count,
      total: totalEmployees
    };
  });

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
      desc: "Active personnel",
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Present Today",
      value: `${presentCount}/${totalEmployees}`,
      icon: CalendarCheck,
      desc: Math.round((presentCount/totalEmployees)*100) + "% attendance rate",
      color: "text-green-600 bg-green-100"
    },
    {
      title: "Late Arrivals",
      value: lateCount,
      icon: Clock,
      desc: "Need attention",
      color: "text-orange-600 bg-orange-100"
    },
    {
      title: "Pending Approvals",
      value: attendance.filter(a => a.approvalStatus === "pending").length,
      icon: AlertTriangle,
      desc: "Require validation",
      color: "text-purple-600 bg-purple-100"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Dashboard Overview</h2>
        <div className="text-sm text-slate-500">
          Today: {format(new Date(), "MMMM dd, yyyy")}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Overview of employee presence over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="present" 
                  fill="hsl(222, 47%, 11%)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest clock-ins and outs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {attendance.slice(-5).reverse().map((att) => {
                 const user = users.find(u => u.id === att.userId);
                 return (
                   <div key={att.id} className="flex items-center">
                     <div className="space-y-1">
                       <p className="text-sm font-medium leading-none">{user?.name}</p>
                       <p className="text-xs text-slate-500">
                         {att.clockOut ? "Clocked Out" : "Clocked In"} at {format(new Date(att.clockOut || att.clockIn || new Date()), "HH:mm")}
                       </p>
                     </div>
                     <div className={`ml-auto font-medium text-xs px-2 py-1 rounded-full ${
                       att.isWithinGeofenceIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                     }`}>
                       {att.isWithinGeofenceIn ? 'Within Zone' : 'Outside Zone'}
                     </div>
                   </div>
                 );
              })}
              {attendance.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No activity yet today.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
