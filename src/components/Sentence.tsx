import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { settingsContext } from '../App';
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
			}, 250);

			return () => {
				clearInterval(interval);
			};
		} else if (timeInSecs !== 0) {
			setTimeInSecs(0);
		}
	}, [startingTime, enabled, halted, setTimeInSecs]);

	return enabled ? timeInSecs : null;
}

export function Sentence({ content, author, refetch }: { content: string; author: string; refetch: () => void }) {
	const splitWords = useMemo(() => content.split(' '), [content]);
	const textRef = useRef<HTMLHeadingElement | null>(null);
	const { settings } = useContext(settingsContext);
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

	if (redContent.length && settings.hardMode) {
		resetState();
		textRef.current?.animate(
			[
				{ transform: 'translateX(0%)', color: 'red' },
				{ transform: 'translateX(-8px)', color: 'red' },
				{ transform: 'translateX(8px)', color: 'red' },
				{ transform: 'translateX(-8px)', color: 'red' },
				{ transform: 'translateX(0%)', color: 'red' },
			],
			{ duration: 300 }
		);
	}

	function onNextChar(e: React.ChangeEvent<HTMLInputElement>) {
		if (currentWordIndex === splitWords.length - 1 && e.target.value === splitWords![currentWordIndex]) {
			setCompleted(true);
			setCurrentInput('');
		} else if (e.target.value === splitWords![currentWordIndex] + ' ') {
			setCurrentWordIndex(currentWordIndex + 1);
			setCurrentInput('');
			setCurrentWordStartingIndex(currentWordStartingIndex + e.target.value.length);
		} else {
			setCurrentInput(e.target.value);
		}
	}

	function share() {
		navigator.share({ title: 'Can you type faster than me?', text: `I got ${Math.round(((doneHalf.length + lastMatchIndex) / timeInSecs!) * 60)} characters per minute. You?`, url: 'https://hatulapro.github.io/typur/' });
	}

	return (
		<div className="flex flex-col h-full justify-evenly items-center">
			<div className={cx('text-center flex justify-center flex-col transition-all mt-4', hasCompleted ? 'flex-grow text-3xl' : 'md:h-16 h-8')}>
				{timeInSecs !== null && (settings.showTime || hasCompleted) && (
					<>
						<p>{timeInSecs}s</p>
						<p>{Math.round(((doneHalf.length + lastMatchIndex) / timeInSecs) * 60)} chars/minute</p>
					</>
				)}
			</div>

			<div className="flex-grow w-4/5 ">
				<h1 ref={textRef} className={cx(hasCompleted ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-2xl sm:text-5xl md:text-6xl lg:text-7xl', 'text-center transition-all pt-4 sm:pt-10 md:pt-16 m-auto')}>
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
				<div className={cx(hasCompleted ? 'max-h-full' : 'max-h-0', 'overflow-hidden transition-all')}>
					<p className="m-2 text-md sm:text-xl">- {author}</p>
				</div>
			</div>
			<div className="flex-grow w-5/6 md:w-1/2 flex justify-start sm:justify-center flex-col">
				<input type="text" disabled={hasCompleted} className="text-center text-xl sm:text-5xl disabled:border-transparent disabled:text-xs disabled:p-0 transition-all white bg-transparent border-2 rounded-lg outline-none p-1" autoFocus value={currentInput} onChange={onNextChar} />
				<div className="flex justify-evenly mt-4 md:mt-8 gap-1">
					<button className="w-28 sm:w-36 hover:bg-pink-700 transition-all bg-pink-800 rounded text-md md:text-xl p-1 sm:px-3 sm:py-2" onClick={resetState}>
						RESTART
					</button>
					{Boolean(navigator.share) && (
						<button className={cx(' hover:bg-blue-700 transition-all bg-blue-800 rounded text-md md:text-xl p-1 sm:px-3 sm:py-2', hasCompleted ? 'w-28 sm:w-36' : 'opacity-0 flex-none w-0')} onClick={share}>
							SHARE
						</button>
					)}
					<button className="w-28 sm:w-36 hover:bg-orange-600 transition-all bg-orange-500 rounded text-md md:text-xl p-1 sm:px-3 sm:py-2" onClick={refetch}>
						NEW QUOTE
					</button>
				</div>
			</div>
		</div>
	);
}
