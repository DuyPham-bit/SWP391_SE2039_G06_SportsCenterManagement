import React from 'react';

/**
 * Keeps a rendering error inside the page that threw it. Without a boundary React unmounts the
 * whole tree, leaving a blank screen with no navigation. Pass the route as `resetKey` so moving to
 * another page clears the error.
 */
export class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.retry = () => this.setState({ error: null });
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page render failed', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isEn = this.props.language === 'en';
    return (
      <div
        role="alert"
        className="p-8 text-center flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-terra-500/40 bg-white/80 dark:bg-brand-navy-900/60 backdrop-blur-sm shadow-lg max-w-lg mx-auto my-8"
      >
        <div className="scms-empty-icon w-14 h-14 rounded-2xl bg-brand-terra-500/15 text-brand-terra-500 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[32px]" aria-hidden="true">error</span>
        </div>
        <h2 className="text-base font-chivo font-black text-brand-navy-900 dark:text-white">
          {isEn ? 'This page could not be displayed' : 'Không thể hiển thị trang này'}
        </h2>
        <p className="text-xs text-brand-navy-600 dark:text-slate-300 max-w-sm mt-2 mb-6 break-words leading-relaxed">
          {isEn
            ? 'Some component data arrived in an unexpected format. Try again, or return to home/menu.'
            : 'Dữ liệu giao diện có định dạng chưa khớp hoặc tải gián đoạn. Hãy thử lại hoặc quay về trang chủ.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={this.retry}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-brand-navy-900 dark:bg-brand-teal-600 text-white text-xs font-chivo font-bold hover:bg-brand-navy-800 dark:hover:bg-brand-teal-500 transition-colors shadow flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">refresh</span>
            <span>{isEn ? 'Try again' : 'Thử lại'}</span>
          </button>
          <a
            href="#/"
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-white/10 bg-white dark:bg-white/5 text-brand-navy-700 dark:text-slate-200 text-xs font-chivo font-bold hover:bg-brand-navy-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">home</span>
            <span>{isEn ? 'Back to Home' : 'Về Trang chủ'}</span>
          </a>
        </div>
      </div>
    );
  }
}

export default PageErrorBoundary;
