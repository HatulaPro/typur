import { cx } from '../general';
import './HistoryViewer.css';

export function HistoryViewer({ values, visible }: { values: number[]; visible: boolean }) {
	const bestValue = Math.max(...values);
	return (
		<div className={cx('w-64 bg-gray-900 transition-all rounded overflow-hidden relative', visible ? 'h-52 p-2' : 'h-0 p-0')}>
			<div className="h-8">Past Performances</div>
			{visible && (
				<div className="gap-2 h-40 flex flex-row items-end">
					{values.map((val, id) => (
						<div key={id} className="HistoryViewer_graphColumn w-12 bg-gray-600 hover:bg-gray-500 text-xs text-center overflow-hidden" style={{ height: `${(val / bestValue) * 90}%`, animationDelay: `${id * 100 + 250}ms` }}>
							{Math.round(val)}
						</div>
					))}
				</div>
			)}
			<div className="HistoryViewer_unitSpan absolute right-0 bottom-0 bg-gray-900 p-1 text-xs opacity-0 transition-all rounded-tl">chars/minute</div>
		</div>
	);
}
