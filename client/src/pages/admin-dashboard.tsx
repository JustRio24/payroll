import { useApp } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CalendarCheck,
  LogIn,
  LogOut,
  Calendar,
  RefreshCw,
  TrendingUp,
  History
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, subDays, formatDistanceToNow, subMonths } from "date-fns";

interface RecentActivity {
  id: string;
  type: 'clock_in' | 'clock_out' | 'leave_request' | 'overtime_request';
  userId: number;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: {
    status?: string;
    isWithinGeofence?: boolean;
    lateMinutes?: number;
    overtimeMinutes?: number;
    duration?: number;
    type?: string;
  };
}

export default function AdminDashboard() {
  const { users, attendance, payrolls, overtime } = useApp();

  const { data: recentActivity = [], isLoading: activityLoading, refetch: refetchActivity } = useQuery<RecentActivity[]>({
    queryKey: ['/api/dashboard/recent-activity'],
    refetchInterval: 30000,
  });

  const totalEmployees = users.filter(u => u.role !== 'admin').length;
  
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  
  const presentCount = todayAttendance.filter(a => a.status === "present").length;
  const lateCount = todayAttendance.filter(a => a.status === "late").length;
  
  // Weekly Attendance Chart Data
  const attendanceChartData = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dStr = format(d, "yyyy-MM-dd");
    const count = attendance.filter(a => a.date === dStr).length;
    return {
      name: format(d, "EEE"),
      present: count
    };
  });

  // Payroll Trend Chart Data (Last 6 Months)
  const payrollChartData = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const pStr = format(d, "yyyy-MM");
    const monthPayrolls = payrolls.filter(p => p.period === pStr);
    const totalNet = monthPayrolls.reduce((sum, p) => sum + p.totalNet, 0);
    return {
      name: format(d, "MMM"),
      net: totalNet / 1000000 // In Millions
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
      desc: totalEmployees > 0 ? Math.round((presentCount/totalEmployees)*100) + "% attendance rate" : "0% attendance rate",
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
      title: "Pending Tasks",
      value: attendance.filter(a => a.approvalStatus === "pending").length + overtime.filter(o => o.status === 'pending').length,
      icon: AlertTriangle,
      desc: "Attendance & Overtime",
      color: "text-purple-600 bg-purple-100"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Dashboard Overview</h2>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {format(new Date(), "MMMM dd, yyyy")}
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Payroll Trend
            </CardTitle>
            <CardDescription>Total net salary in Millions (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={payrollChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}M`} />
                <Tooltip />
                <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="w-4 h-4 text-blue-500" />
              Weekly Attendance
            </CardTitle>
            <CardDescription>Number of employees present per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="present" fill="hsl(222, 47%, 11%)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              Recent Activity
              {activityLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
            </CardTitle>
            <CardDescription>Realtime logs for clocking, leaves, and overtime</CardDescription>
          </div>
          <button 
            onClick={() => refetchActivity()}
            className="p-2 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
          </button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid md:grid-cols-2 gap-3">
              {recentActivity.map((activity) => {
                const getIcon = () => {
                  switch (activity.type) {
                    case 'clock_in': return <LogIn className="h-4 w-4 text-green-600" />;
                    case 'clock_out': return <LogOut className="h-4 w-4 text-blue-600" />;
                    case 'leave_request': return <Calendar className="h-4 w-4 text-orange-600" />;
                    case 'overtime_request': return <Clock className="h-4 w-4 text-purple-600" />;
                    default: return <Clock className="h-4 w-4 text-slate-600" />;
                  }
                };

                const getStatusBadge = () => {
                  if (activity.type === 'clock_in') {
                    if (activity.metadata?.lateMinutes && activity.metadata.lateMinutes > 0) {
                      return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Late {activity.metadata.lateMinutes}m</Badge>;
                    }
                    return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">On Time</Badge>;
                  }
                  if (activity.type === 'clock_out' && activity.metadata?.overtimeMinutes && activity.metadata.overtimeMinutes > 0) {
                    return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">OT {activity.metadata.overtimeMinutes}m</Badge>;
                  }
                  if (activity.type === 'overtime_request') {
                    return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">{activity.metadata?.duration}m ({activity.metadata?.status})</Badge>;
                  }
                  if (activity.type === 'leave_request') {
                    return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">{activity.metadata?.status}</Badge>;
                  }
                  return null;
                };

                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                    <div className="rounded-full bg-white p-2 shadow-sm">
                      {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-900">{activity.userName}</p>
                        {getStatusBadge()}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {activity.description}
                        {activity.metadata?.isWithinGeofence === false && (
                          <span className="text-red-500 ml-1 font-medium">(Outside zone)</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentActivity.length === 0 && !activityLoading && (
                <div className="col-span-2 text-center py-8">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No activity recorded today</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
