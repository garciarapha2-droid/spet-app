import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Upload, Camera, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";

export default function GuestRegistrationPanel({ open, onClose, onRegister, prefillNfc }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!open) { stopCamera(); setName(""); setEmail(""); setPhone(""); setBirthday(""); setAvatar(null); }
  }, [open, stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
    } catch {
      toast.error("Não foi possível acessar a câmera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 320;
    canvas.height = 320;
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 320, 320);
    setAvatar(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) { toast.error("Nome é obrigatório"); return; }
    onRegister({
      name: trimmedName,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      birthday: birthday || undefined,
      nfcId: prefillNfc || undefined,
      avatar: avatar || undefined,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl"
            data-testid="guest-registration-panel"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-6 border-b border-border/30">
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-testid="reg-back-btn"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-foreground">Guest Registration</h2>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-6">

                {/* Avatar / Photo */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-28 w-28 rounded-full border-2 border-dashed border-border/50 bg-muted/30 overflow-hidden flex items-center justify-center" data-testid="avatar-circle">
                    {cameraActive ? (
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover rounded-full" />
                    ) : avatar ? (
                      <img src={avatar} alt="Avatar" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground/50" />
                    )}
                    {avatar && !cameraActive && (
                      <button
                        onClick={() => setAvatar(null)}
                        className="absolute top-0 right-0 h-6 w-6 rounded-full bg-destructive flex items-center justify-center"
                        data-testid="remove-avatar"
                      >
                        <X className="h-3 w-3 text-destructive-foreground" />
                      </button>
                    )}
                  </div>

                  {cameraActive ? (
                    <div className="flex gap-2">
                      <button onClick={capturePhoto} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" data-testid="capture-btn">
                        <Camera className="h-3.5 w-3.5" /> Capturar
                      </button>
                      <button onClick={stopCamera} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors" data-testid="cancel-camera-btn">
                        Cancelar
                      </button>
                    </div>
                  ) : !avatar ? (
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted/50 transition-colors" data-testid="upload-btn">
                        <Upload className="h-3.5 w-3.5" /> Upload Photo
                      </button>
                      <button onClick={startCamera} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted/50 transition-colors" data-testid="camera-btn">
                        <Camera className="h-3.5 w-3.5" /> Camera
                      </button>
                    </div>
                  ) : null}

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  <canvas ref={canvasRef} className="hidden" />
                  <span className="text-xs text-muted-foreground">Optional</span>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-4">
                  {/* NFC Tag */}
                  {prefillNfc && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-3" data-testid="nfc-tag-display">
                      <span className="text-sm text-primary">NFC Tag: <span className="font-mono font-semibold">{prefillNfc}</span></span>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Name <span className="text-destructive">*</span></label>
                    <Input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Full name"
                      maxLength={100}
                      data-testid="reg-name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      maxLength={255}
                      data-testid="reg-email"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+55 11 9xxxx-xxxx"
                      maxLength={20}
                      data-testid="reg-phone"
                    />
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Birthday <span className="text-xs text-muted-foreground">(optional)</span></label>
                    <Input
                      type="date"
                      value={birthday}
                      onChange={e => setBirthday(e.target.value)}
                      data-testid="reg-birthday"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-border/30">
              <button
                onClick={handleSubmit}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors"
                data-testid="register-guest-btn"
              >
                Register Guest
              </button>
              <button
                onClick={onClose}
                className="h-12 px-6 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 transition-colors"
                data-testid="reg-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
