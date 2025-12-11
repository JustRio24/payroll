import { useState } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { FileText, Download, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { CheckCircle } from "lucide-react";

export default function PayrollList() {
  const { payrolls, users, generatePayroll, finalizePayroll } = useApp();
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));

  const handleGenerate = () => {
    generatePayroll(period);
  };

  const filteredPayrolls = payrolls.filter(p => p.period === period);

  // Currency formatter
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Payroll</h2>
          <p className="text-slate-500">Manage salaries and payslips</p>
        </div>
        
        <div className="flex items-center gap-2">
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
          
          <Button onClick={handleGenerate} className="bg-orange-500 hover:bg-orange-600 text-white">
            <PlayCircle className="w-4 h-4 mr-2" /> Generate
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
           <CardTitle>Payroll Records - {format(new Date(period + "-01"), "MMMM yyyy")}</CardTitle>
           <CardDescription>
             {filteredPayrolls.length} records generated
           </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead className="text-right">Overtime</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.map((payroll) => {
                const user = users.find(u => u.id === payroll.userId);
                const totalDeductions = Object.values(payroll.deductions).reduce((a, b) => a + b, 0);
                
                return (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">
                       <div>{user?.name}</div>
                       <div className="text-xs text-slate-500">{user?.position}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatIDR(payroll.basicSalary)}</TableCell>
                    <TableCell className="text-right text-green-600">+{formatIDR(payroll.overtimePay)}</TableCell>
                    <TableCell className="text-right text-red-600">-{formatIDR(totalDeductions)}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{formatIDR(payroll.totalNet)}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant="outline" className={payroll.status === 'final' ? 'border-green-500 text-green-700' : 'border-slate-300 text-slate-500'}>
                         {payroll.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-1">
                         {payroll.status === 'draft' && (
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             title="Finalize & Approve"
                             className="text-green-600 hover:text-green-700 hover:bg-green-50"
                             onClick={() => finalizePayroll(payroll.id)}
                           >
                             <CheckCircle className="w-4 h-4" />
                           </Button>
                         )}
                         <Link href={`/admin/payroll/${payroll.id}`}>
                           <Button variant="ghost" size="icon" title="View Details">
                             <FileText className="w-4 h-4 text-slate-500" />
                           </Button>
                         </Link>
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayrolls.length === 0 && (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      No payroll records found for this period. Click "Generate" to calculate.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
