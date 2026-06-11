'use client';

/** چت بیمار–پزشک با تحویل بلادرنگ (Socket.io) */
import { useEffect, useRef, useState } from 'react';
import { ChatApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/stores/auth';
import { jalaliTime } from '@/lib/fa';

interface Msg {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}
interface Conv {
  id: string;
  partner: { id: string; fullName: string } | null;
  lastMessage: Msg | null;
  unread: number;
}

const demoConvs: Conv[] = [
  { id: 'c1', partner: { id: 'doc1', fullName: 'دکتر سارا موسوی' }, lastMessage: { id: 'm0', senderId: 'doc1', body: 'قند ناشتای امروز را برایم بفرستید', createdAt: new Date().toISOString() }, unread: 1 },
];
const demoMsgs: Msg[] = [
  { id: 'm1', senderId: 'doc1', body: 'سلام، نتایج هفته گذشته را بررسی کردم. روند خوبی دارید 👍', createdAt: new Date(Date.now() - 3600e3).toISOString() },
  { id: 'm2', senderId: 'me', body: 'سلام دکتر، ممنون. فقط شب‌ها کمی احساس افت قند دارم.', createdAt: new Date(Date.now() - 3000e3).toISOString() },
  { id: 'm3', senderId: 'doc1', body: 'قند ناشتای امروز را برایم بفرستید تا دوز لانتوس را بازبینی کنم.', createdAt: new Date(Date.now() - 600e3).toISOString() },
];

export default function ChatPage() {
  const { accessToken } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [offline, setOffline] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // بارگیری مکالمات
  useEffect(() => {
    ChatApi.conversations()
      .then((c) => setConvs(c as Conv[]))
      .catch(() => {
        setConvs(demoConvs);
        setOffline(true);
      });
  }, []);

  // دریافت بلادرنگ
  useEffect(() => {
    const s = getSocket(accessToken);
    if (!s) return;
    const onMsg = (m: Msg & { conversationId: string }) => {
      setMsgs((arr) => (active && m.conversationId === active.id ? [...arr, m] : arr));
    };
    s.on('chat:message', onMsg);
    return () => {
      s.off('chat:message', onMsg);
    };
  }, [accessToken, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const openConv = (c: Conv) => {
    setActive(c);
    if (offline) {
      setMsgs(demoMsgs);
      return;
    }
    ChatApi.messages(c.id).then((m) => setMsgs(m as Msg[])).catch(() => setMsgs(demoMsgs));
  };

  const send = async () => {
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText('');
    const optimistic: Msg = { id: `tmp-${Date.now()}`, senderId: 'me', body, createdAt: new Date().toISOString() };
    setMsgs((m) => [...m, optimistic]);
    if (!offline) {
      try {
        await ChatApi.send(active.id, body);
      } catch {
        /* پیام در UI می‌ماند؛ در نسخه کامل صف retry اضافه می‌شود */
      }
    }
  };

  const isMine = (m: Msg) => m.senderId === 'me' || (!offline && m.senderId !== active?.partner?.id);

  return (
    <main className="mx-auto max-w-6xl px-5 py-7">
      <header className="mb-5 flex items-center gap-3">
        <h1 className="text-xl font-extrabold">💬 گفتگو با پزشک</h1>
        {offline && (
          <span className="mr-auto rounded-full bg-amber-400/10 px-3 py-1.5 text-xs text-amber-300">
            حالت پیش‌نمایش — داده نمونه
          </span>
        )}
      </header>

      <div className="grid h-[70vh] grid-cols-1 gap-4 md:grid-cols-3">
        {/* ---------- لیست مکالمات ---------- */}
        <aside className="glass-card overflow-y-auto !p-3">
          {convs.length === 0 && <p className="txt2 p-4 text-center text-xs">مکالمه‌ای ندارید</p>}
          {convs.map((c) => (
            <button
              key={c.id}
              onClick={() => openConv(c)}
              className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-right transition ${
                active?.id === c.id ? 'bg-teal-400/10' : 'hover:bg-white/5'
              }`}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-pink-400 text-sm font-bold text-white">
                {c.partner?.fullName.charAt(0) ?? '؟'}
              </div>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{c.partner?.fullName}</b>
                <span className="txt2 block truncate text-[11px]">{c.lastMessage?.body ?? '—'}</span>
              </div>
              {c.unread > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-teal-400 text-[10px] font-bold text-black">
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* ---------- رشته پیام ---------- */}
        <section className="glass-card flex flex-col md:col-span-2">
          {!active ? (
            <div className="txt2 grid flex-1 place-items-center text-sm">یک مکالمه را انتخاب کنید</div>
          ) : (
            <>
              <div className="border-b border-white/10 pb-3 font-bold">{active.partner?.fullName}</div>
              <div className="flex-1 space-y-3 overflow-y-auto py-4">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${isMine(m) ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                        isMine(m)
                          ? 'rounded-br-md bg-gradient-to-l from-teal-400/90 to-sky-400/90 text-white'
                          : 'rounded-bl-md border border-white/10 bg-white/5'
                      }`}
                    >
                      {m.body}
                      <div className={`mt-1 text-[10px] ${isMine(m) ? 'text-white/70' : 'txt2'}`}>
                        {jalaliTime(new Date(m.createdAt))}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 border-t border-white/10 pt-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="پیام خود را بنویسید…"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-teal-400/50"
                />
                <button
                  onClick={send}
                  className="rounded-xl bg-gradient-to-l from-teal-400 to-sky-400 px-6 text-sm font-bold text-white"
                >
                  ارسال
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
