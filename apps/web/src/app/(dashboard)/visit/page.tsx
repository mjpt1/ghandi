'use client';

/**
 * ویزیت تصویری — WebRTC خام + سیگنالینگ Socket.io
 * بدون بک‌اند: فقط پیش‌نمایش دوربین خودتان (حالت دمو)
 */
import { useEffect, useRef, useState } from 'react';
import { ChatApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/stores/auth';

interface Partner {
  userId: string;
  fullName: string;
  subtitle: string;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VisitPage() {
  const { accessToken } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [target, setTarget] = useState<Partner | null>(null);
  const [status, setStatus] = useState<'idle' | 'calling' | 'in-call' | 'demo'>('idle');
  const [error, setError] = useState('');

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    ChatApi.partners()
      .then((p) => setPartners(p as Partner[]))
      .catch(() =>
        setPartners([{ userId: 'demo-doc', fullName: 'دکتر سارا موسوی', subtitle: 'غدد و متابولیسم' }]),
      );
  }, []);

  // دریافت سیگنال‌های WebRTC
  useEffect(() => {
    const s = getSocket(accessToken);
    if (!s) return;

    const onSignal = async ({ data }: { from: string; data: any }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (data.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            s.emit('webrtc:signal', { to: target?.userId, data: { sdp: answer } });
          }
        } else if (data.ice) {
          await pc.addIceCandidate(new RTCIceCandidate(data.ice));
        }
      } catch {
        /* سیگنال نامعتبر نادیده گرفته می‌شود */
      }
    };
    s.on('webrtc:signal', onSignal);
    return () => {
      s.off('webrtc:signal', onSignal);
    };
  }, [accessToken, target]);

  const startCall = async (p: Partner) => {
    setTarget(p);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const s = getSocket(accessToken);
      if (!s || p.userId === 'demo-doc') {
        setStatus('demo');
        return;
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
        setStatus('in-call');
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) s.emit('webrtc:signal', { to: p.userId, data: { ice: e.candidate } });
      };

      setStatus('calling');
      s.emit('webrtc:call', { to: p.userId, action: 'ring' });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      s.emit('webrtc:signal', { to: p.userId, data: { sdp: offer } });
    } catch {
      setError('دسترسی به دوربین/میکروفون داده نشد یا در دسترس نیست.');
      setStatus('idle');
    }
  };

  const endCall = () => {
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const s = getSocket(accessToken);
    if (target && s) s.emit('webrtc:call', { to: target.userId, action: 'end' });
    setStatus('idle');
    setTarget(null);
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-7">
      <header className="mb-6">
        <h1 className="text-xl font-extrabold">🎥 ویزیت تصویری</h1>
        <p className="txt2 mt-1 text-sm">تماس امن و مستقیم (P2P) با پزشک شما</p>
      </header>

      {status === 'idle' ? (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {partners.map((p) => (
            <div key={p.userId} className="glass-card flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-pink-400 font-extrabold text-white">
                {p.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <b className="block truncate">{p.fullName}</b>
                <span className="txt2 text-xs">{p.subtitle}</span>
              </div>
              <button
                onClick={() => startCall(p)}
                className="rounded-xl bg-gradient-to-l from-teal-400 to-sky-400 px-5 py-2.5 text-xs font-bold text-white"
              >
                📞 تماس
              </button>
            </div>
          ))}
          {error && <p className="rounded-xl bg-red-400/10 px-4 py-3 text-xs text-red-300 md:col-span-2">{error}</p>}
        </section>
      ) : (
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
            {/* ویدیوی طرف مقابل */}
            <video ref={remoteRef} autoPlay playsInline className="aspect-video w-full object-cover" />
            {status !== 'in-call' && (
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="mx-auto mb-3 grid h-16 w-16 animate-pulse place-items-center rounded-3xl bg-gradient-to-br from-violet-400 to-pink-400 text-2xl font-extrabold text-white">
                    {target?.fullName.charAt(0)}
                  </div>
                  <b>{target?.fullName}</b>
                  <p className="txt2 mt-1 text-xs">
                    {status === 'demo' ? 'حالت دمو — فقط دوربین شما نمایش داده می‌شود' : 'در حال برقراری تماس…'}
                  </p>
                </div>
              </div>
            )}
            {/* ویدیوی خودم */}
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-4 left-4 aspect-video w-40 rounded-2xl border border-white/20 object-cover shadow-xl md:w-56"
            />
          </div>

          <div className="mt-5 flex justify-center">
            <button
              onClick={endCall}
              className="rounded-2xl bg-red-500 px-10 py-3.5 text-sm font-bold text-white transition hover:bg-red-600"
            >
              ⛔ پایان تماس
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
