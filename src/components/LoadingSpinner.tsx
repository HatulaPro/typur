import './LoadingSpinner.css';

export function LoadingSpinner() {
	return (
		<div className="loadingSpinner_circle w-28 h-28 border-transparent border-4 rounded-full grid place-items-center">
			<div className="loadingSpinner_circle w-24 h-24 border-transparent border-4 rounded-full grid place-items-center">
				<div className="loadingSpinner_circle w-20 h-20 border-transparent border-4 rounded-full grid place-items-center"></div>
			</div>
		</div>
	);
}
