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
  RefreshCw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface RecentActivity {
  id: string;
  type: 'clock_in' | 'clock_out' | 'leave_request';
  userId: number;
  userName: string;
  description: string;
  timestamp: string;
  metadata?: {
    status?: string;
    isWithinGeofence?: boolean;
    lateMinutes?: number;
    overtimeMinutes?: number;
    type?: string;
  };
}

export default function AdminDashboard() {
  const { users, attendance, payrolls } = useApp();

  const { data: recentActivity = [], isLoading: activityLoading, refetch: refetchActivity } = useQuery<RecentActivity[]>({
    queryKey: ['/api/dashboard/recent-activity'],
    refetchInterval: 30000,
  });

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
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                Aktivitas Terkini
                {activityLoading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
              </CardTitle>
              <CardDescription>Realtime clock-in, clock-out, dan cuti</CardDescription>
            </div>
            <button 
              onClick={() => refetchActivity()}
              className="p-2 rounded-md hover:bg-slate-100 transition-colors"
              data-testid="button-refresh-activity"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px] pr-4">
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const getIcon = () => {
                    switch (activity.type) {
                      case 'clock_in': return <LogIn className="h-4 w-4 text-green-600" />;
                      case 'clock_out': return <LogOut className="h-4 w-4 text-blue-600" />;
                      case 'leave_request': return <Calendar className="h-4 w-4 text-orange-600" />;
                      default: return <Clock className="h-4 w-4 text-slate-600" />;
                    }
                  };

                  const getStatusBadge = () => {
                    if (activity.type === 'clock_in') {
                      if (activity.metadata?.lateMinutes && activity.metadata.lateMinutes > 0) {
                        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Terlambat {activity.metadata.lateMinutes}m</Badge>;
                      }
                      return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Tepat Waktu</Badge>;
                    }
                    if (activity.type === 'clock_out' && activity.metadata?.overtimeMinutes && activity.metadata.overtimeMinutes > 0) {
                      const otHours = activity.metadata.overtimeMinutes / 60;
                      const displayHours = otHours % 1 === 0 ? Math.round(otHours) : otHours.toFixed(1);
                      return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Lembur {displayHours}j</Badge>;
                    }
                    if (activity.type === 'leave_request') {
                      return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">{activity.metadata?.status === 'pending' ? 'Menunggu' : activity.metadata?.status}</Badge>;
                    }
                    return null;
                  };

                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors" data-testid={`activity-item-${activity.id}`}>
                      <div className="rounded-full bg-white p-2 shadow-sm">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900 truncate">{activity.userName}</p>
                          {getStatusBadge()}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {activity.description}
                          {activity.metadata?.isWithinGeofence === false && (
                            <span className="text-red-500 ml-1">(Di luar zona)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: idLocale })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {recentActivity.length === 0 && !activityLoading && (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Belum ada aktivitas hari ini</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
