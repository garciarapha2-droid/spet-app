import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mail, MessageSquare, Smartphone, HelpCircle, Camera, Send, CheckCircle, Paperclip, X, FileText } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageNavbar, PageFooter } from './PrivacyPolicy';

const API = process.env.REACT_APP_BACKEND_URL;

const commonTopics = [
  { icon: HelpCircle, label: 'Account issues' },
  { icon: MessageSquare, label: 'App errors' },
  { icon: Smartphone, label: 'NFC functionality' },
  { icon: HelpCircle, label: 'General questions' },
];

const includeItems = [
  { icon: Smartphone, text: 'Your device type' },
  { icon: MessageSquare, text: 'A description of the issue' },
  { icon: Camera, text: 'Screenshots if possible' },
];

const supportSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000),
});

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];

const emptyForm = { name: '', email: '', subject: '', message: '' };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Support() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files);
    setAttachments(prev => {
      const remaining = MAX_FILES - prev.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return prev;
      }
      const toAdd = newFiles.slice(0, remaining);
      const valid = [];
      for (const file of toAdd) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 10MB limit`);
          continue;
        }
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast.error(`${file.name}: unsupported file type`);
          continue;
        }
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        valid.push({ file, preview, id: crypto.randomUUID() });
      }
      if (newFiles.length > remaining) {
        toast.error(`Only ${remaining} more file(s) allowed`);
      }
      return [...prev, ...valid];
    });
  }, []);

  const removeFile = (id) => {
    setAttachments(prev => {
      const item = prev.find(a => a.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(a => a.id !== id);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = supportSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach(err => {
        const key = err.path[0];
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API}/api/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to send');
      }
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
      setForm(emptyForm);
      attachments.forEach(a => a.preview && URL.revokeObjectURL(a.preview));
      setAttachments([]);
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Try again.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200';

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="support-page">
      <PageNavbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-[720px] mx-auto">
          <h1
            className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-[-0.035em] leading-[1.08] text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            data-testid="support-title"
          >
            Support
          </h1>
          <p className="mt-4 text-[15px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
            If you need help with the SPET app, we are here to assist you.
          </p>

          {/* Contact Form Card */}
          <div className="mt-12 premium-card rounded-2xl p-6 md:p-8" data-testid="support-form-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="icon-badge !w-10 !h-10 !rounded-lg">
                <Mail size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-foreground">Contact us</h2>
                <p className="text-[13px]" style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}>
                  We typically respond within 24-48 hours
                </p>
              </div>
            </div>

            {sent ? (
              <div className="text-center py-8" data-testid="support-success">
                <div className="icon-badge !rounded-2xl !w-14 !h-14 mx-auto">
                  <CheckCircle size={24} className="text-primary" />
                </div>
                <p className="mt-4 text-[16px] font-semibold text-foreground">Message sent!</p>
                <p className="mt-2 text-[14px] max-w-[360px] mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Thank you for reaching out. Our team will review your message and get back to you shortly.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-3 text-[13px] text-primary hover:underline"
                  data-testid="support-send-another"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} data-testid="support-form">
                {/* Name + Email row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => update('name', e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                      maxLength={100}
                      data-testid="support-name"
                    />
                    {errors.name && <p className="text-[12px] text-destructive mt-1.5">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="you@company.com"
                      className={inputClass}
                      maxLength={255}
                      data-testid="support-email"
                    />
                    {errors.email && <p className="text-[12px] text-destructive mt-1.5">{errors.email}</p>}
                  </div>
                </div>

                {/* Subject */}
                <div className="mt-4">
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={e => update('subject', e.target.value)}
                    placeholder="What do you need help with?"
                    className={inputClass}
                    maxLength={200}
                    data-testid="support-subject"
                  />
                  {errors.subject && <p className="text-[12px] text-destructive mt-1.5">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div className="mt-4">
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => update('message', e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    className={`${inputClass} resize-none`}
                    maxLength={2000}
                    data-testid="support-message"
                  />
                  <div className="flex justify-between mt-1.5">
                    {errors.message ? (
                      <p className="text-[12px] text-destructive">{errors.message}</p>
                    ) : <span />}
                    <span className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                      {form.message.length}/2000
                    </span>
                  </div>
                </div>

                {/* Attachments */}
                <div className="mt-4">
                  <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                    Attachments{' '}
                    <span className="font-normal" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                      (optional - max {MAX_FILES} files, 10MB each)
                    </span>
                  </label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-200 p-5 text-center ${
                      dragging
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-secondary/30'
                    }`}
                    data-testid="support-dropzone"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ACCEPTED_TYPES.join(',')}
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.length) addFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <Paperclip size={20} className="mx-auto" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }} />
                    <p className="mt-2 text-[13px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span className="font-medium text-foreground">Click to attach</span> or drag & drop
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                      PNG, JPG, GIF, WebP, PDF, TXT
                    </p>
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 bg-secondary/40 border border-border rounded-lg px-3 py-2.5" data-testid="support-attachment">
                          {a.preview ? (
                            <img src={a.preview} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{a.file.name}</p>
                            <p className="text-[11px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>{formatSize(a.file.size)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(a.id); }}
                            className="p-1 rounded-md hover:bg-destructive/10 transition-colors shrink-0"
                          >
                            <X size={14} className="text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-premium mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg h-11 text-[14px] font-semibold disabled:opacity-50"
                  data-testid="support-submit"
                >
                  {sending ? (
                    <span className="animate-pulse">Sending...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Message
                      {attachments.length > 0 && (
                        <span className="text-[12px] opacity-70">
                          ({attachments.length} file{attachments.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-5 text-[13px] text-center" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
              Or email us directly at{' '}
              <a href="mailto:support@spetapp.com" className="text-primary hover:underline" data-testid="support-email-link">
                support@spetapp.com
              </a>
            </p>
          </div>

          {/* Common Topics */}
          <div className="mt-12" data-testid="support-topics">
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground">Common topics</h2>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {commonTopics.map(({ icon: Icon, label }) => (
                <div key={label} className="premium-card rounded-xl p-4 flex items-center gap-3">
                  <Icon size={16} className="text-primary shrink-0" />
                  <span className="text-[14px] font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Please Include */}
          <div className="mt-12" data-testid="support-include">
            <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-foreground">Please include</h2>
            <div className="space-y-3 mt-5">
              {includeItems.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-[15px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-12 text-center text-[15px]" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}>
            Thank you for using SPET.
          </p>
        </div>
      </main>
      <PageFooter />
    </div>
  );
}
