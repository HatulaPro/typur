import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { settingsContext } from '../App';
import { cx } from '../general';
import { HistoryViewer } from './HistoryViewer';

import './Sentence.css';

function lastMatchingIndex(a?: string, b?: string): number {
	if (!a || !b) return 0;
	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return i;
	}
	return a.length;
}

function useTimer(enabled: boolean, halted: boolean) {
	const startingTime = useMemo(() => new Date(), [enabled]);
	const timeInSecs = useRef<number | null>(enabled ? 0 : null);
	const subs = useRef<Set<(x: number | null) => void>>(new Set());

	useEffect(() => {
		if (enabled) {
			const interval = setInterval(() => {
				if (!halted) {
					timeInSecs.current = enabled ? Math.round((new Date().getTime() - startingTime.getTime()) / 1000) : null;
					subs.current.forEach((f) => f(timeInSecs.current));
				}
			}, 100);

			return () => {
				clearInterval(interval);
			};
		} else if (timeInSecs.current !== 0) {
			timeInSecs.current = enabled ? 0 : null;
		}
		subs.current.forEach((f) => f(timeInSecs.current));
	}, [startingTime, enabled, halted]);

	function subscribe(f: (x: number | null) => void) {
		subs.current.add(f);

		return () => {
			subs.current.delete(f);
		};
	}

	return [enabled ? timeInSecs.current : null, subscribe] as const;
}

function useHistory() {
	function getCurrentHistory() {
		const currentHistory = localStorage.getItem('history');
		return currentHistory ? (JSON.parse(currentHistory) as number[]) : [];
	}
	const [history, setHistory] = useState<number[]>(getCurrentHistory());
	useEffect(() => {
		if (history) {
			localStorage.setItem('history', JSON.stringify(history));
		}
	}, [history]);

	return [history, setHistory] as const;
}

const TimerViewer = memo(({ timeInSecs, subscribe, hasCompleted, correctCharsCount }: { timeInSecs: number | null; subscribe: (f: (x: number | null) => void) => () => void; hasCompleted: boolean; correctCharsCount: number }) => {
	const { settings } = useContext(settingsContext);
	const [currentTime, setCurrentTime] = useState<number | null>(timeInSecs);
	const [history] = useHistory();

	useEffect(() => {
		const sub = subscribe((newTime) => setCurrentTime(newTime));

		return sub;
	}, [subscribe, setCurrentTime]);

	return currentTime !== null && (settings.showTime || hasCompleted) ? (
		<>
			<p>{currentTime}s</p>
			<p>{hasCompleted ? Math.round(history[history.length - 1]) : Math.round((correctCharsCount / currentTime) * 60)} chars/minute</p>
		</>
	) : (
		<></>
	);
});

export function Sentence({ content, author, refetch }: { content: string; author: string; refetch: () => void }) {
	const splitWords = useMemo(() => content.split(' '), [content]);
	const textRef = useRef<HTMLHeadingElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const { settings } = useContext(settingsContext);
	const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
	const [currentWordStartingIndex, setCurrentWordStartingIndex] = useState<number>(0);
	const [currentInput, setCurrentInput] = useState<string>('');
	const [hasCompleted, setCompleted] = useState<boolean>(false);
	const [history, setHistory] = useHistory();

	useEffect(() => {
		if (inputRef.current !== null && !hasCompleted) {
			inputRef.current.focus();
		}
	}, [hasCompleted, inputRef.current]);

	const doneHalf = splitWords.slice(0, currentWordIndex).join(' ');

	const lastMatchIndex = lastMatchingIndex(splitWords[currentWordIndex], currentInput);
	const redContent = content.slice(currentWordStartingIndex + lastMatchIndex, currentWordStartingIndex + Math.max(lastMatchIndex, currentInput.length));

	const todoHalf = content.slice(doneHalf.length + lastMatchIndex + redContent.length + (currentInput.length && currentWordIndex ? 1 : 0));

	const [timeInSecs, subscribe] = useTimer(currentWordIndex !== 0 || currentInput.length !== 0, hasCompleted);

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
			setHistory([...history, (correctCharsCount / timeInSecs!) * 60].slice(-5));
		} else if (e.target.value === splitWords![currentWordIndex] + ' ') {
			setCurrentWordIndex(currentWordIndex + 1);
			setCurrentInput('');
			setCurrentWordStartingIndex(currentWordStartingIndex + e.target.value.length);
		} else {
			setCurrentInput(e.target.value);
		}
	}

	const correctCharsCount = hasCompleted ? content.length : doneHalf.length + lastMatchIndex;
	function share() {
		doneHalf.length + lastMatchIndex;
		navigator.share({ title: 'Can you type faster than me?', text: `I got ${Math.round((correctCharsCount / timeInSecs!) * 60)} characters per minute. You?`, url: 'https://hatulapro.github.io/typur/' });
	}

	return (
		<div className="flex flex-col h-full justify-evenly items-center">
			<div className={cx('text-center flex justify-center flex-col transition-all mt-4', hasCompleted ? 'flex-grow text-3xl' : 'md:h-16 h-8')}>
				<TimerViewer correctCharsCount={correctCharsCount} hasCompleted={hasCompleted} subscribe={subscribe} timeInSecs={timeInSecs} />
			</div>

			<div className="flex-grow w-4/5 ">
				<div className={cx('flex mt-4 sm:mt-10 md:mt-16 items-center gap-1 m-auto w-4/5 max-w-xs sm:max-w-md lg:max-w-lg', correctCharsCount === 0 && 'opacity-0')}>
					<div>{Math.round((correctCharsCount / content.length) * 100)}%</div>
					<div className="bg-white h-2 flex-grow transition-all rounded-r Sentence_progressBar" style={{ maxWidth: `${(correctCharsCount / content.length) * 100}%` }}></div>
				</div>
				<div className="flex flex-col relative">
					<div className={cx('Sentence_instructions absolute text-xl sm:text-4xl md:text-5xl flex flex-row items-center gap-1 text-orange-400 transition-all', correctCharsCount !== 0 && 'opacity-0')}>
						<FontAwesomeIcon icon={faArrowDown} size="xl" />
						<span>Type this</span>
						<FontAwesomeIcon icon={faArrowDown} size="xl" />
					</div>
					<h1 ref={textRef} className={cx(hasCompleted ? 'text-3xl md:text-5xl lg:text-6xl' : 'text-2xl sm:text-5xl md:text-6xl lg:text-7xl', 'text-center transition-all m-auto mt-2')}>
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

				<div className={cx(hasCompleted ? 'max-h-full' : 'max-h-0', 'overflow-hidden transition-all')}>
					<p className="m-2 text-md sm:text-xl">- {author}</p>
				</div>
			</div>
			<HistoryViewer values={history} visible={hasCompleted} />
			<div className="flex-grow w-5/6 md:w-1/2 flex justify-start sm:justify-center flex-col">
				<input ref={inputRef} type="text" disabled={hasCompleted} className="text-center text-xl sm:text-5xl disabled:border-transparent disabled:text-xs disabled:p-0 transition-all white bg-transparent border-2 rounded-lg outline-none p-1" autoFocus value={currentInput} onChange={onNextChar} />
				<div className="flex justify-evenly mt-4 md:mt-8 gap-1">
					<button
						className="w-28 sm:w-36 hover:bg-pink-700 transition-all bg-pink-800 rounded text-md md:text-xl p-1 sm:px-3 sm:py-2"
						onClick={() => {
							resetState();
							inputRef.current?.focus();
						}}
					>
						RESTART
					</button>
					{Boolean(navigator.share) && (
						<button className={cx(' hover:bg-blue-700 transition-all bg-blue-800 rounded text-md md:text-xl p-1 sm:px-3 sm:py-2', hasCompleted ? 'w-28 sm:w-36' : 'opacity-0 flex-none w-0')} onClick={share}>
							SHARE
						</button>
					)}
					<button
						className="w-28 sm:w-36 hover:bg-orange-600 transition-all bg-orange-500 rounded text-md md:text-xl p-1 sm:px-3 sm:py-2"
						onClick={() => {
							refetch();
							inputRef.current?.focus();
						}}
					>
						NEW QUOTE
					</button>
				</div>
			</div>
		</div>
	);
}
