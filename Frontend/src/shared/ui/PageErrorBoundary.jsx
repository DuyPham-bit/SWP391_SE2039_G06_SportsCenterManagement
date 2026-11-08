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
      <div role="alert" className="p-8 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-terra-500/40 bg-brand-terra-500/5 dark:bg-brand-navy-900/40">
        <div className="scms-empty-icon w-12 h-12 rounded-2xl bg-brand-terra-500/15 text-brand-terra-500 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[28px]" aria-hidden="true">error</span>
        </div>
        <h2 className="text-sm font-bold text-ink">
          {isEn ? 'This page could not be displayed' : 'Không thể hiển thị trang này'}
        </h2>
        <p className="text-xs text-ink-muted max-w-sm mt-1 mb-4 break-words">
          {isEn
            ? 'Some data arrived in an unexpected format. Try again, or open another page from the menu.'
            : 'Dữ liệu trả về có định dạng không như mong đợi. Hãy thử lại hoặc mở trang khác từ menu.'}
        </p>
        <button
          type="button"
          onClick={this.retry}
          className="px-4 py-2 rounded-xl bg-brand-navy-900 text-white text-xs font-bold hover:bg-brand-navy-800 transition-colors"
        >
          {isEn ? 'Try again' : 'Thử lại'}
        </button>
      </div>
    );
  }
}

export default PageErrorBoundary;
