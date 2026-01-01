import { useRef } from "react";
import { useRoute } from "wouter";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
// Pastikan path import ini sesuai dengan struktur folder Anda
import generatedLogo from "@assets/generated_images/minimalist_geometric_construction_logo.png";
import signatureImg from "../assets/Signature.png"; 

export default function PayrollSlip() {
  const [matchAdmin, paramsAdmin] = useRoute("/admin/payroll/:id");
  const [matchEmp, paramsEmp] = useRoute("/employee/payslips/:id");
  
  const { payrolls, users, config, user: currentUser } = useApp();
  const slipRef = useRef<HTMLDivElement>(null);

  const idParam = matchAdmin ? paramsAdmin?.id : paramsEmp?.id;
  const id = idParam ? Number(idParam) : null;
  const payroll = payrolls.find(p => p.id === id);
  const employee = users.find(u => u.id === payroll?.userId);

  // Check if payroll exists first
  if (!payroll || !employee) {
    return <div className="p-8 text-center text-slate-500">Payslip not found</div>;
  }

  // Security check for employee view
  if (matchEmp && currentUser?.role !== 'admin' && currentUser?.id !== payroll.userId) {
      return <div className="p-8 text-center text-red-500">Unauthorized access to this payslip.</div>;
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    // --- Signature Placeholder ---
    const signatureHRDImage = signatureImg; 
    const signatureEmpImage = null; 

    // ===================== HEADER WITH LOGO =====================
    try {
        doc.addImage(generatedLogo, 'PNG', 15, 15, 25, 25);
    } catch (e) {
        console.error("Failed to load logo:", e);
    }

    // Company Name & Address
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(config.companyName.toUpperCase(), 45, 25); 

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(config.companyAddress, 45, 32);

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE PAYSLIP", 195, 25, { align: 'right' }); 
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ID: ${payroll.id}`, 195, 32, { align: 'right' });

    // Separator Line
    doc.setLineWidth(0.5);
    doc.line(15, 42, 195, 42); 
    // ==============================================================


    // Employee Info
    doc.setFontSize(10);
    // Note: date-fns defaults to English, so "MMMM yyyy" outputs "January 2026"
    doc.text(`Period: ${format(new Date(payroll.period + "-01"), "MMMM yyyy")}`, 195, 50, { align: 'right' });

    autoTable(doc, {
      startY: 55,
      body: [
        ['Name', employee.name, 'Position', employee.position || '-'],
        ['Employee ID', String(employee.id), 'Status', 'Permanent'], // Changed "NIK" to "Employee ID"
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 2: { fontStyle: 'bold', cellWidth: 30 } }
    });

    // Earnings
    doc.setFont("helvetica", "bold");
    doc.text("EARNINGS", 14, (doc as any).lastAutoTable.finalY + 10);
    doc.setFont("helvetica", "normal");

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Description', 'Amount']],
      body: [
        ['Basic Salary', formatIDR(payroll.basicSalary)],
        ['Overtime Pay', formatIDR(payroll.overtimePay)],
        ['Bonus', formatIDR(payroll.bonus)],
        [{ content: 'Total Earnings', styles: { fontStyle: 'bold' } }, { content: formatIDR(payroll.basicSalary + payroll.overtimePay + payroll.bonus), styles: { fontStyle: 'bold' } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [220, 252, 231], textColor: [21, 128, 61], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }
    });

    // Deductions
    doc.setFont("helvetica", "bold");
    doc.text("DEDUCTIONS", 14, (doc as any).lastAutoTable.finalY + 10);
    doc.setFont("helvetica", "normal");

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Description', 'Amount']],
      body: [
        ['Insurance (BPJS)', formatIDR(payroll.deductions.bpjs)],
        ['Income Tax (PPh 21)', formatIDR(payroll.deductions.pph21)],
        ['Late Penalty', formatIDR(payroll.deductions.late)],
        [{ content: 'Total Deductions', styles: { fontStyle: 'bold' } }, { content: `(${formatIDR(Object.values(payroll.deductions).reduce((a,b)=>a+b,0))})`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [254, 226, 226], textColor: [185, 28, 28], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }
    });

    // Net Take Home Pay Box
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, 182, 25, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("NET SALARY (TAKE HOME PAY)", 20, finalY + 10);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(formatIDR(payroll.totalNet), 190, finalY + 16, { align: 'right' });
    doc.setTextColor(0, 0, 0); 


    // ===================== FOOTER WITH SIGNATURE =====================
    const footerY = finalY + 40;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Palembang, ${format(new Date(), "dd MMMM yyyy")}`, 190, footerY, { align: 'right' });

    // --- Left Column (Employee) ---
    const colKiriX = 50;
    doc.text("Recipient,", colKiriX, footerY + 10, { align: 'center' });

    if (signatureEmpImage) {
       doc.addImage(signatureEmpImage, 'PNG', colKiriX - 15, footerY + 15, 30, 15);
    }

    doc.setFont("helvetica", "bold");
    doc.text(`( ${employee.name} )`, colKiriX, footerY + 35, { align: 'center' });


    // --- Right Column (HRD) ---
    const colKananX = 150;
    doc.setFont("helvetica", "normal");
    doc.text("Approved by,", colKananX, footerY + 10, { align: 'center' });

    if (signatureHRDImage) {
       doc.addImage(signatureHRDImage, 'PNG', colKananX - 15, footerY + 15, 30, 15);
    }

    doc.setFont("helvetica", "bold");
    doc.text("( HRD Manager )", colKananX, footerY + 35, { align: 'center' });
    // ======================================================================

    // Filename in English
    doc.save(`payslip_${employee.name}_${payroll.period}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href={matchAdmin ? "/admin/payroll" : "/employee/payslips"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold font-display">Payslip Detail</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button onClick={downloadPDF} className="bg-slate-900 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-lg print:shadow-none print:border-none" id="printable-area">
        <div className="p-8 md:p-12 space-y-8 bg-white text-slate-900" ref={slipRef}>
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-8">
            <div className="flex items-center gap-4">
              <img src={generatedLogo} alt="Logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-xl font-bold font-display tracking-tight text-slate-900">{config.companyName.toUpperCase()}</h1>
                <p className="text-sm text-slate-500 max-w-xs">{config.companyAddress}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-900">PAYSLIP</h2>
              <p className="text-slate-500 font-mono">{payroll.id}</p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Employee Name</span>
                <span className="font-semibold">{employee.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-medium">{employee.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Position</span>
                <span className="font-medium">{employee.position}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Period</span>
                <span className="font-semibold">{format(new Date(payroll.period + "-01"), "MMMM yyyy")}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-1">
                <span className="text-slate-500">Print Date</span>
                <span className="font-medium">{format(new Date(), "dd MMM yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-700 mb-4 border-b border-green-200 pb-2">Earnings</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-medium">{formatIDR(payroll.basicSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Pay</span>
                  <span className="font-medium">{formatIDR(payroll.overtimePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus</span>
                  <span className="font-medium">{formatIDR(payroll.bonus)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-slate-900 text-base">
                  <span>Total Earnings</span>
                  <span>{formatIDR(payroll.basicSalary + payroll.overtimePay + payroll.bonus)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-700 mb-4 border-b border-red-200 pb-2">Deductions</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Insurance (BPJS)</span>
                  <span className="font-medium text-red-600">({formatIDR(payroll.deductions.bpjs)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Income Tax (PPh 21)</span>
                  <span className="font-medium text-red-600">({formatIDR(payroll.deductions.pph21)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Late Penalty</span>
                  <span className="font-medium text-red-600">({formatIDR(payroll.deductions.late)})</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-100 font-bold text-slate-900 text-base">
                  <span>Total Deductions</span>
                  <span>({formatIDR(Object.values(payroll.deductions).reduce((a,b)=>a+b,0))})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">Net Salary (Take Home Pay)</p>
              {/* Optional: You can implement a number-to-words function here later */}
              <p className="text-xs text-slate-400 mt-1">In Words: # Net Amount #</p>
            </div>
            <div className="text-3xl font-bold text-slate-900 font-display">
              {formatIDR(payroll.totalNet)}
            </div>
          </div>

          {/* Signature */}
          <div className="pt-12 grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-20">Recipient,</p>
              <p className="font-bold border-t border-slate-300 inline-block px-8 pt-2">{employee.name}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-20">Approved By,</p>
              <p className="font-bold border-t border-slate-300 inline-block px-8 pt-2">HRD Manager</p>
            </div>
          </div>

        </div>
      </Card>
      
      <style>{`
        @media print {
          .no-print { display: none; }
          body { background: white; }
          .shadow-lg { box-shadow: none; }
          .border-slate-200 { border: none; }
        }
      `}</style>
    </div>
  );
}