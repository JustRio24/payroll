import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function AttendanceCapture() {
  const { user, clockIn, clockOut, attendance, config } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check today's status
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRecord = attendance.find(a => a.userId === user?.id && a.date === todayStr);
  
  const hasClockedIn = !!todayRecord?.clockIn;
  const hasClockedOut = !!todayRecord?.clockOut;

  useEffect(() => {
    startCamera();
    getLocation();
    return () => {
       stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
     if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsCameraActive(false);
     }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setPhoto(dataUrl);
      }
    }
  };

  const getLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Could not access location. Please allow location permissions.");
          setIsLocating(false);
          
          // Fallback for demo if blocked (simulate being near office)
          // setLocation({ lat: config.officeLat, lng: config.officeLng }); 
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setIsLocating(false);
    }
  };

  const handleAction = async (type: "in" | "out") => {
    if (!photo || !location) {
      toast({ title: "Requirements missing", description: "Photo and location are required.", variant: "destructive" });
      return;
    }

    if (type === "in") {
      await clockIn(location.lat, location.lng, photo);
    } else {
      await clockOut(location.lat, location.lng, photo);
    }
    setPhoto(null); // Reset
  };

  const getDistance = () => {
    if (!location) return null;
    const R = 6371e3; // metres
    const φ1 = location.lat * Math.PI/180;
    const φ2 = config.officeLat * Math.PI/180;
    const Δφ = (config.officeLat-location.lat) * Math.PI/180;
    const Δλ = (config.officeLng-location.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c;
    return Math.round(d); // in meters
  };

  const distance = getDistance();
  const isWithinZone = distance !== null && distance <= config.geofenceRadius;

  if (hasClockedIn && hasClockedOut) {
    return (
      <Card className="max-w-md mx-auto mt-8 border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
             <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-900">Attendance Complete</h3>
            <p className="text-green-700">You have successfully clocked in and out for today.</p>
          </div>
          <div className="text-sm text-green-800">
            Clock In: {format(new Date(todayRecord.clockIn!), "HH:mm")} <br/>
            Clock Out: {format(new Date(todayRecord.clockOut!), "HH:mm")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-display">
          {hasClockedIn ? "Clock Out" : "Clock In"}
        </h2>
        <p className="text-slate-500">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
             {photo ? (
               <img src={photo} alt="Capture" className="w-full h-full object-cover" />
             ) : (
               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
             )}
             <canvas ref={canvasRef} width="320" height="240" className="hidden" />
             
             {!photo && (
               <Button 
                 size="icon" 
                 className="absolute bottom-4 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full border-4 border-white bg-transparent hover:bg-white/20 transition-all"
                 onClick={capturePhoto}
               >
                 <div className="w-10 h-10 bg-red-500 rounded-full" />
               </Button>
             )}
             
             {photo && (
               <Button 
                 variant="secondary" 
                 size="sm" 
                 className="absolute top-4 right-4 bg-white/80 hover:bg-white"
                 onClick={() => setPhoto(null)}
               >
                 <RefreshCw className="w-4 h-4 mr-2" /> Retake
               </Button>
             )}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
               <div className={`p-2 rounded-full ${isWithinZone ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                 <MapPin className="w-5 h-5" />
               </div>
               <div className="flex-1">
                 <h4 className="font-medium text-slate-900">Location Status</h4>
                 {isLocating ? (
                   <p className="text-sm text-slate-500 animate-pulse">Locating...</p>
                 ) : error ? (
                   <p className="text-sm text-red-500">{error}</p>
                 ) : (
                   <div className="space-y-1">
                     <p className="text-sm text-slate-600">
                       {distance !== null ? `${distance} meters from office` : "Unknown distance"}
                     </p>
                     <p className={`text-xs font-bold ${isWithinZone ? 'text-green-600' : 'text-orange-600'}`}>
                       {isWithinZone ? "WITHIN GEOFENCE" : "OUTSIDE GEOFENCE"}
                     </p>
                   </div>
                 )}
               </div>
               <Button variant="ghost" size="icon" onClick={getLocation} disabled={isLocating}>
                 <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
               </Button>
            </div>

            <Button 
              className={`w-full h-12 text-lg font-bold ${
                hasClockedIn ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"
              }`}
              disabled={!photo || !location || isLocating}
              onClick={() => handleAction(hasClockedIn ? "out" : "in")}
            >
              {hasClockedIn ? "CLOCK OUT" : "CLOCK IN"}
            </Button>
            
            {!isWithinZone && distance !== null && (
              <div className="flex items-center justify-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <AlertTriangle className="w-3 h-3" />
                <span>Attendance outside geofence will be flagged for review.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
