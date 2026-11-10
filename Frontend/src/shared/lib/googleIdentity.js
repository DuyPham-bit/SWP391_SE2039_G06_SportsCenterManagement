export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
let pending;

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (pending) return pending;
  pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google);
      else { pending = null; script.remove(); reject(new Error('Không tải được đăng nhập Google.')); }
    };
    script.onerror = () => { pending = null; script.remove(); reject(new Error('Không kết nối được Google. Vui lòng thử lại.')); };
    document.head.appendChild(script);
  });
  return pending;
}
