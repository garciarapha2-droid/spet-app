import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Upload, User, X } from "lucide-react";
import { toast } from "sonner";

export function GuestRegistration({ onRegister, onCancel, prefillNfc }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [photo, setPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch {
      toast.error("Não foi possível acessar a câmera");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const v = videoRef.current;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const sx = (v.videoWidth - size) / 2;
    const sy = (v.videoHeight - size) / 2;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 320, 320);
    setPhoto(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    onRegister({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      nfcId: prefillNfc || undefined,
      avatar: photo || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl"
      data-testid="guest-registration-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 p-6">
        <button
          onClick={onCancel}
          className="rounded-xl p-2 hover:bg-muted/50 transition-colors"
          data-testid="registration-back-btn"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">Guest Registration</h2>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-border/50 bg-muted/30 overflow-hidden">
              {showCamera ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              ) : photo ? (
                <motion.img
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  src={photo}
                  alt="Guest"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground/50" />
              )}
            </div>
            {photo && !showCamera && (
              <button
                onClick={() => setPhoto(null)}
                className="absolute top-0 right-0 h-6 w-6 bg-destructive rounded-full flex items-center justify-center text-destructive-foreground"
                data-testid="remove-photo-btn"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {showCamera ? (
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="inline-flex items-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="capture-photo-btn"
              >
                <Camera className="h-3.5 w-3.5" /> Capturar
              </button>
              <button
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                data-testid="cancel-camera-btn"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                data-testid="upload-photo-btn"
              >
                <Upload className="h-3.5 w-3.5" /> Upload Photo
              </button>
              <button
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                data-testid="camera-btn"
              >
                <Camera className="h-3.5 w-3.5" /> Camera
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Optional</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Name *
            </label>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              data-testid="guest-name-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              data-testid="guest-email-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Phone</label>
            <input
              type="tel"
              placeholder="+55 11 9xxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              data-testid="guest-phone-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
              Birthday (optional)
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              data-testid="guest-birthday-input"
            />
          </div>
          {prefillNfc && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm text-primary" data-testid="nfc-prefill-indicator">
              NFC Tag: <span className="font-mono font-bold">{prefillNfc}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-border/30 p-6">
        <button
          onClick={handleSubmit}
          className="flex-1 h-12 rounded-md bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 transition-colors"
          data-testid="register-guest-btn"
        >
          Register Guest
        </button>
        <button
          onClick={onCancel}
          className="h-12 px-6 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="cancel-registration-btn"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
