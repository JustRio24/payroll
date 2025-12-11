import { useState } from "react";
import { useApp, JobPosition } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";

export default function AdminSettings() {
  const { config, updateConfig, positions, addPosition, deletePosition } = useApp();

  const [newPosition, setNewPosition] = useState("");
  const [newRate, setNewRate] = useState("");

  const [companyName, setCompanyName] = useState(config.companyName);
  const [companyAddress, setCompanyAddress] = useState(config.companyAddress);
  const [vision, setVision] = useState(config.vision || "");
  const [mission, setMission] = useState(config.mission || "");
  const [history, setHistory] = useState(config.history || "");

  const [officeLat, setOfficeLat] = useState(config.officeLat.toString());
  const [officeLng, setOfficeLng] = useState(config.officeLng.toString());
  const [radius, setRadius] = useState(config.geofenceRadius.toString());
  const [penalty, setPenalty] = useState(config.latePenaltyPerMinute.toString());
  const [bpjsKes, setBpjsKes] = useState((config.bpjsKesehatanRate * 100).toString());
  const [bpjsTk, setBpjsTk] = useState((config.bpjsKetenagakerjaanRate * 100).toString());

  const handleSaveCompany = () => {
    updateConfig({
       companyName,
       companyAddress,
       vision,
       mission,
       history
    });
  };

  const handleSaveSystem = () => {
    updateConfig({
       officeLat: parseFloat(officeLat),
       officeLng: parseFloat(officeLng),
       geofenceRadius: parseInt(radius),
       latePenaltyPerMinute: parseInt(penalty),
       bpjsKesehatanRate: parseFloat(bpjsKes) / 100,
       bpjsKetenagakerjaanRate: parseFloat(bpjsTk) / 100
    });
  };

  const handleAddPosition = () => {
     if (newPosition && newRate) {
        addPosition({ title: newPosition, hourlyRate: parseInt(newRate) });
        setNewPosition("");
        setNewRate("");
     }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Settings</h2>
        <p className="text-slate-500">Configure application parameters</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-slate-100">
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="positions">Master Data</TabsTrigger>
          <TabsTrigger value="system">System Config</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-4 mt-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Public information about the organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Vision</Label>
                <Textarea value={vision} onChange={e => setVision(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Mission</Label>
                <Textarea value={mission} onChange={e => setMission(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>History</Label>
                <Textarea value={history} onChange={e => setHistory(e.target.value)} className="min-h-[100px]" />
              </div>
              <Button onClick={handleSaveCompany} className="bg-slate-900">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4 mt-6">
           <Card className="border-slate-200 shadow-sm">
             <CardHeader>
               <CardTitle>Job Positions & Rates</CardTitle>
               <CardDescription>Manage standard hourly rates for payroll</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="flex gap-4 mb-6">
                 <Input placeholder="Position Title" value={newPosition} onChange={e => setNewPosition(e.target.value)} className="max-w-xs" />
                 <Input type="number" placeholder="Rate (Rp)" value={newRate} onChange={e => setNewRate(e.target.value)} className="max-w-[150px]" />
                 <Button onClick={handleAddPosition}><Plus className="w-4 h-4 mr-2" /> Add</Button>
               </div>
               
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Position Title</TableHead>
                     <TableHead>Hourly Rate (IDR)</TableHead>
                     <TableHead className="text-right">Action</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {positions.map((pos) => (
                     <TableRow key={pos.title}>
                       <TableCell className="font-medium">{pos.title}</TableCell>
                       <TableCell>Rp {pos.hourlyRate.toLocaleString('id-ID')}</TableCell>
                       <TableCell className="text-right">
                         <Button variant="ghost" size="icon" onClick={() => deletePosition(pos.title)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4 mt-6">
           <Card className="border-slate-200 shadow-sm">
             <CardHeader>
               <CardTitle>System Configuration</CardTitle>
               <CardDescription>Technical parameters for calculation</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid gap-6 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Office Latitude</Label>
                   <Input value={officeLat} onChange={e => setOfficeLat(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <Label>Office Longitude</Label>
                   <Input value={officeLng} onChange={e => setOfficeLng(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <Label>Geofence Radius (meters)</Label>
                   <Input type="number" value={radius} onChange={e => setRadius(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <Label>Late Penalty (Rp/minute)</Label>
                   <Input type="number" value={penalty} onChange={e => setPenalty(e.target.value)} />
                 </div>
                 <div className="space-y-2">
                   <Label>BPJS Kesehatan Employee Share (%)</Label>
                   <Input type="number" value={bpjsKes} onChange={e => setBpjsKes(e.target.value)} step="0.1" />
                 </div>
                 <div className="space-y-2">
                   <Label>BPJS Ketenagakerjaan Employee Share (%)</Label>
                   <Input type="number" value={bpjsTk} onChange={e => setBpjsTk(e.target.value)} step="0.1" />
                 </div>
               </div>
               <Button onClick={handleSaveSystem} className="bg-slate-900">
                 <Save className="w-4 h-4 mr-2" /> Update Configuration
               </Button>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
