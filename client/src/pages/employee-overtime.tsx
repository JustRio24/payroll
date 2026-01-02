import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Clock, Plus, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function EmployeeOvertime() {
  const { user, overtime, requestOvertime } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 60,
    reason: ""
  });

  const myOvertime = overtime.filter(ot => ot.userId === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason) return;
    
    setIsSubmitting(true);
    try {
      await requestOvertime({
        date: formData.date,
        durationMinutes: formData.durationMinutes,
        reason: formData.reason
      });
      setIsOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        durationMinutes: 60,
        reason: ""
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Overtime Requests</h2>
          <p className="text-slate-500">Submit and track your overtime work</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="w-4 h-4 mr-2" />
              Request Overtime
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Overtime Request</DialogTitle>
              <DialogDescription>
                Submit your overtime work for approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minutes">Duration (Minutes)</Label>
                <Input 
                  id="minutes" 
                  type="number" 
                  min="30"
                  step="30"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                  required
                />
                <p className="text-xs text-slate-500">Example: 60 = 1 hour, 90 = 1.5 hours</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason / Description of Work</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Describe what you worked on during overtime..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 hover:bg-orange-600">
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>My Request History</CardTitle>
          <CardDescription>Status of your submitted overtime</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myOvertime.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                    No overtime requests found
                  </TableCell>
                </TableRow>
              ) : (
                myOvertime.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {format(new Date(req.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {req.durationMinutes} mins
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={req.reason}>
                      {req.reason}
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                        req.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                      }`}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {req.approvedAt ? format(new Date(req.approvedAt), "MMM dd, HH:mm") : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
