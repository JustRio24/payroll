import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function EmployeeLeave() {
  const { user, leaves, requestLeave } = useApp();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [type, setType] = useState<"annual" | "sick" | "other">("annual");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<string>("");

  const myLeaves = leaves.filter(l => l.userId === user?.id).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    requestLeave({
      type,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      reason,
      attachment: attachment || undefined
    });

    // Reset
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
    setAttachment("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       // Mock upload - just read as data URL
       const reader = new FileReader();
       reader.onload = (evt) => {
          if (evt.target?.result) {
            setAttachment(evt.target.result as string);
          }
       };
       reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Leave Requests</h2>
        <p className="text-slate-500">Apply for annual leave, sick leave, or permission</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Request Form */}
        <Card className="md:col-span-1 border-slate-200 shadow-sm h-fit">
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>Submit a new leave application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave (Cuti Tahunan)</SelectItem>
                    <SelectItem value="sick">Sick Leave (Sakit)</SelectItem>
                    <SelectItem value="other">Other Permission (Izin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea 
                  placeholder="Explain why you need leave..." 
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Attachment (Proof/Doctor's Note)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="file" 
                    accept=".jpg,.png,.pdf" 
                    onChange={handleFileUpload}
                  />
                </div>
                {attachment && <p className="text-xs text-green-600">File attached successfully</p>}
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>My Leave History</CardTitle>
            <CardDescription>Track status of your applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myLeaves.map(leave => (
                <div key={leave.id} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                     <div className={cn("p-2 rounded-full mt-1", 
                        leave.type === 'sick' ? "bg-red-100 text-red-600" : 
                        leave.type === 'annual' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                     )}>
                        {leave.type === 'sick' ? <Upload className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                     </div>
                     <div>
                        <h4 className="font-medium text-slate-900 capitalize">{leave.type} Leave</h4>
                        <p className="text-sm text-slate-500">
                          {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm text-slate-600 mt-1 italic">"{leave.reason}"</p>
                        {leave.attachment && (
                          <div className="mt-2 text-xs text-blue-600 underline cursor-pointer">View Attachment</div>
                        )}
                     </div>
                  </div>
                  <div>
                    <Badge className={cn("capitalize",
                      leave.status === 'approved' ? "bg-green-100 text-green-700 hover:bg-green-200" :
                      leave.status === 'rejected' ? "bg-red-100 text-red-700 hover:bg-red-200" :
                      "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    )}>
                      {leave.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {myLeaves.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No leave history found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
