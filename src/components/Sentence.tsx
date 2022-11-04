import { useEffect, useMemo, useState } from 'react';

function lastMatchingIndex(a?: string, b?: string): number {
	if (!a || !b) return 0;
	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return i;
	}
	return a.length;
}

function useTimer(enabled: boolean) {
	const startingTime = useMemo(() => new Date(), [enabled]);
	const [timeInSecs, setTimeInSecs] = useState<number>(0);

	useEffect(() => {
		if (enabled) {
			setInterval(() => {
				setTimeInSecs(Math.round((new Date().getTime() - startingTime.getTime()) / 1000));
			}, 500);
		}
	}, [startingTime, enabled, setTimeInSecs]);

	return timeInSecs;
}

export function Sentence({ content, onSuccess }: { content: string; onSuccess: () => void }) {
	const splitWords = useMemo(() => content.split(' '), [content]);

	const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
	const [currentWordStartingIndex, setCurrentWordStartingIndex] = useState<number>(0);
	const [currentInput, setCurrentInput] = useState<string>('');

	const doneHalf = splitWords ? splitWords.slice(0, currentWordIndex).join(' ') : '';

	const lastMatchIndex = splitWords ? lastMatchingIndex(splitWords[currentWordIndex], currentInput) : 0;
	const redContent = content.slice(currentWordStartingIndex + lastMatchIndex, currentWordStartingIndex + Math.max(lastMatchIndex, currentInput.length));

	const todoHalf = content.slice(doneHalf.length + lastMatchIndex + redContent.length + (currentInput.length && currentWordIndex ? 1 : 0));

	const timeInSecs = useTimer(currentWordIndex !== 0 || currentInput.length !== 0);

	function resetState() {
		setCurrentWordIndex(0);
		setCurrentWordStartingIndex(0);
		setCurrentInput('');
	}

	function onNextChar(e: React.ChangeEvent<HTMLInputElement>) {
		if (currentWordIndex === splitWords.length - 1 && e.target.value === splitWords![currentWordIndex]) {
			resetState();
			onSuccess();
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
			<div className="text-center h-8 pt-4">
				{timeInSecs > 0 && (
					<>
						<p>{timeInSecs}s</p>
						<p>{Math.round(((doneHalf.length + lastMatchIndex) / timeInSecs) * 60)} chars/minute</p>
					</>
				)}
			</div>
			<div className="flex-grow">
				<h1 className="text-7xl text-center pt-20 w-4/5 m-auto">
					<span className="text-green-500">{doneHalf}</span>
					<span className="App_highlightedText text-green-500">
						{' ' + splitWords![currentWordIndex].slice(0, Math.max(lastMatchIndex, 0))}
						<span className="text-red-500 underline">{redContent}</span>
					</span>
					{todoHalf}
				</h1>
			</div>
			<div className="flex-grow w-1/2">
				<input type="text" className="text-center  text-5xl white bg-transparent border-2 rounded-lg outline-none p-1" autoFocus value={currentInput} onChange={onNextChar} />
			</div>
		</div>
	);
}
