import { useEffect, useMemo, useState } from 'react';
import { cx } from '../general';

function lastMatchingIndex(a?: string, b?: string): number {
	if (!a || !b) return 0;
	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return i;
	}
	return a.length;
}

function useTimer(enabled: boolean, halted: boolean): number | null {
	const startingTime = useMemo(() => new Date(), [enabled]);
	const [timeInSecs, setTimeInSecs] = useState<number>(0);

	useEffect(() => {
		if (enabled) {
			const interval = setInterval(() => {
				if (!halted) {
					setTimeInSecs(Math.round((new Date().getTime() - startingTime.getTime()) / 1000));
				}
			}, 500);

			return () => {
				clearInterval(interval);
			};
		} else if (timeInSecs !== 0) {
			setTimeInSecs(0);
		}
	}, [startingTime, enabled, halted, setTimeInSecs]);

	return enabled ? timeInSecs : null;
}

export function Sentence({ content, refetch }: { content: string; refetch: () => void }) {
	const splitWords = useMemo(() => content.split(' '), [content]);
	const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
	const [currentWordStartingIndex, setCurrentWordStartingIndex] = useState<number>(0);
	const [currentInput, setCurrentInput] = useState<string>('');
	const [hasCompleted, setCompleted] = useState<boolean>(false);

	const doneHalf = splitWords ? splitWords.slice(0, currentWordIndex).join(' ') : '';

	const lastMatchIndex = splitWords ? lastMatchingIndex(splitWords[currentWordIndex], currentInput) : 0;
	const redContent = content.slice(currentWordStartingIndex + lastMatchIndex, currentWordStartingIndex + Math.max(lastMatchIndex, currentInput.length));

	const todoHalf = content.slice(doneHalf.length + lastMatchIndex + redContent.length + (currentInput.length && currentWordIndex ? 1 : 0));

	const timeInSecs = useTimer(currentWordIndex !== 0 || currentInput.length !== 0, hasCompleted);

	function resetState() {
		setCurrentWordIndex(0);
		setCurrentWordStartingIndex(0);
		setCurrentInput('');
		setCompleted(false);
	}

	function onNextChar(e: React.ChangeEvent<HTMLInputElement>) {
		if (currentWordIndex === splitWords.length - 1 && e.target.value === splitWords![currentWordIndex]) {
			// resetState();
			setCompleted(true);
			setCurrentInput('');
			// refetch();
		} else if (e.target.value === splitWords![currentWordIndex] + ' ') {
			setCurrentWordIndex(currentWordIndex + 1);
			setCurrentInput('');
			setCurrentWordStartingIndex(currentWordStartingIndex + e.target.value.length);
		} else {
			setCurrentInput(e.target.value);
		}
	}
	return (
		<div className="flex flex-col h-full justify-evenly items-center">
			<div className={cx('text-center flex justify-center flex-col transition-all pt-4', hasCompleted ? 'flex-grow text-3xl' : 'h-8')}>
				{timeInSecs !== null && (
					<>
						<p>{timeInSecs}s</p>
						<p>{Math.round(((doneHalf.length + lastMatchIndex) / timeInSecs) * 60)} chars/minute</p>
					</>
				)}
			</div>

			<div className="flex-grow">
				<h1 className={cx(hasCompleted ? 'text-6xl' : 'text-7xl', 'text-center transition-all pt-20 w-4/5 m-auto')}>
					{hasCompleted ? (
						<span className="text-green-500">{content}</span>
					) : (
						<>
							<span className="text-green-500">{doneHalf}</span>
							<span className="App_highlightedText text-green-500">
								{' ' + splitWords![currentWordIndex].slice(0, Math.max(lastMatchIndex, 0))}
								<span className="text-red-500 underline">{redContent}</span>
							</span>
							{todoHalf}
						</>
					)}
				</h1>
			</div>
			<div className="flex-grow w-1/2 flex justify-center flex-col">
				<input type="text" disabled={hasCompleted} className="text-center text-5xl disabled:border-transparent disabled:text-xs disabled:p-0 transition-all white bg-transparent border-2 rounded-lg outline-none p-1" autoFocus value={currentInput} onChange={onNextChar} />
				<div className="flex justify-evenly my-8">
					<button className="w-36 hover:bg-pink-700 transition-all bg-pink-800 rounded text-xl px-3 py-2" onClick={resetState}>
						RESTART
					</button>
					<button className="w-36 hover:bg-orange-700 transition-all bg-orange-800 rounded text-xl px-3 py-2" onClick={refetch}>
						NEW QUOTE
					</button>
				</div>
			</div>
		</div>
	);
}
