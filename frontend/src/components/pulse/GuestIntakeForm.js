import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Camera, X, User } from 'lucide-react';

export const GuestIntakeForm = ({ venueConfig, onSubmit, onCancel, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 320 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      // Camera not available — allow file upload instead
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 320);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setPhoto(dataUrl);
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
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, email, phone, dob, photo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="guest-intake-form">
      {/* Photo capture */}
      <div className="flex flex-col items-center gap-4">
        {photo ? (
          <div className="relative">
            <img src={photo} alt="Guest" className="w-32 h-32 rounded-full object-cover border-2 border-primary" />
            <button type="button" onClick={() => setPhoto(null)}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              data-testid="remove-photo-btn">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : cameraActive ? (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-32 h-32 rounded-full object-cover border-2 border-primary" />
            <Button type="button" size="sm" onClick={capturePhoto} className="mt-2 w-full" data-testid="capture-photo-btn">
              Capture
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={startCamera} data-testid="start-camera-btn">
                <Camera className="h-4 w-4 mr-1" /> Camera
              </Button>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>Upload</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} data-testid="upload-photo-input" />
              </label>
            </div>
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

      {/* DOB — conditional */}
      {venueConfig?.host_collect_dob && (
        <div className="space-y-2">
          <Label htmlFor="guest-dob">Date of Birth</Label>
          <Input id="guest-dob" type="date" value={dob} onChange={e => setDob(e.target.value)}
            data-testid="guest-dob-input" />
        </div>
      )}

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
