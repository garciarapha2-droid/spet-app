import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Camera, X, User, Upload, AlertCircle } from 'lucide-react';

export const GuestIntakeForm = ({ venueConfig, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 320 },
      });
      streamRef.current = stream;
      setCameraActive(true);
      // Wait for next tick so video element is rendered
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera blocked by browser. Use file upload instead.'
          : 'Camera not available. Use file upload instead.'
      );
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Verify the image is not blank
    if (dataUrl && dataUrl.length > 100) {
      setPhoto(dataUrl);
    }
    stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result); setCameraError(null); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, email, phone, dob, photo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="guest-intake-form">
      {/* Photo section */}
      <div className="flex flex-col items-center gap-3">
        {photo ? (
          <div className="relative">
            <img src={photo} alt="Guest" className="w-28 h-28 rounded-full object-cover border-2 border-primary" />
            <button type="button" onClick={() => setPhoto(null)}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              data-testid="remove-photo-btn">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : cameraActive ? (
          <div className="flex flex-col items-center gap-2">
            <video ref={videoRef} autoPlay playsInline muted className="w-28 h-28 rounded-full object-cover border-2 border-primary" />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={capturePhoto} data-testid="capture-photo-btn">
                Capture
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-photo-btn">
                <Upload className="h-4 w-4 mr-1" /> Upload Photo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={startCamera} data-testid="start-camera-btn">
                <Camera className="h-4 w-4 mr-1" /> Camera
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden"
              onChange={handleFileUpload} data-testid="upload-photo-input" />
            {cameraError && (
              <p className="text-xs text-destructive flex items-center gap-1" data-testid="camera-error">
                <AlertCircle className="h-3 w-3" /> {cameraError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Optional</p>
          </div>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="guest-name">Name *</Label>
        <Input id="guest-name" value={name} onChange={e => setName(e.target.value)}
          placeholder="Full name" required autoFocus data-testid="guest-name-input" />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="guest-email">Email</Label>
        <Input id="guest-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="email@example.com" data-testid="guest-email-input" />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="guest-phone">Phone</Label>
        <Input id="guest-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+55 11 9xxxx-xxxx" data-testid="guest-phone-input" />
      </div>

      {/* DOB — always visible, optional */}
      <div className="space-y-2">
        <Label htmlFor="guest-dob">Birthday <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input id="guest-dob" type="date" value={dob} onChange={e => setDob(e.target.value)}
          data-testid="guest-dob-input" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1" disabled={!name.trim() || loading} data-testid="submit-intake-btn">
          {loading ? 'Saving...' : 'Register Guest'}
        </Button>
        <Button type="button" variant="outline" onClick={() => { stopCamera(); onCancel(); }} data-testid="cancel-intake-btn">
          Cancel
        </Button>
      </div>
    </form>
  );
};
