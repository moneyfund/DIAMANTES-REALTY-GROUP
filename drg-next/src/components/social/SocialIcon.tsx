type SocialIconProps={
  network:string;
  size?:number;
  className?:string;
};

export function SocialIcon({network,size=18,className}:SocialIconProps){
  const key=network.trim().toLowerCase();
  const common={width:size,height:size,viewBox:"0 0 24 24",className,"aria-hidden":true,focusable:false} as const;

  if(key.includes("facebook"))return <svg {...common} fill="currentColor"><path d="M13.7 22v-8.1h2.8l.42-3.15H13.7V8.74c0-.91.27-1.53 1.61-1.53h1.72V4.4c-.3-.04-1.32-.12-2.5-.12-2.48 0-4.18 1.47-4.18 4.18v2.29H7.55v3.15h2.8V22h3.35Z"/></svg>;

  if(key.includes("instagram"))return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.4" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>;

  if(key.includes("youtube"))return <svg {...common} fill="none"><rect x="2.5" y="5.3" width="19" height="13.4" rx="4.2" fill="currentColor"/><path d="m10.1 9 5.1 3-5.1 3V9Z" fill="white"/></svg>;

  if(key.includes("tiktok"))return <svg {...common} fill="currentColor"><path d="M14.1 3h3.05c.28 1.62 1.27 2.88 2.85 3.53V9.7a8.18 8.18 0 0 1-2.98-.92v6.07A6.15 6.15 0 1 1 11 8.71v3.2a2.96 2.96 0 1 0 2.97 2.94L14.1 3Z"/></svg>;

  if(key.includes("whatsapp"))return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.4 11.6a8.4 8.4 0 0 1-12.28 7.43L3.6 20.4l1.4-4.35A8.4 8.4 0 1 1 20.4 11.6Z"/><path d="M8.4 7.8c.33-.21.66-.18.86.12l1.17 1.76c.18.26.15.58-.06.82l-.6.69c.46 1.02 1.36 1.93 2.45 2.46l.72-.61c.25-.21.57-.23.84-.05l1.76 1.2c.28.19.32.54.12.86-.52.82-1.4 1.32-2.35 1.25-2.08-.15-4.67-1.67-6.12-3.92-1.1-1.72-1.17-3.42-.65-4.18.44-.65 1.13-.99 1.86-1.1Z"/></svg>;

  return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>;
}
