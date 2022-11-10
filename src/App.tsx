import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import './App.css';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Sentence } from './components/Sentence';
import { cx } from './general';

type RandomQuoteResponse = {
	_id: string;
	content: string;
	author: string;
	tags: string[];
	authorSlug: string;
	length: number;
	dateAdded: string;
	dateModified: string;
};

type Settings = {
	hardMode: boolean;
	showTime: boolean;
};

function getCurrentSettings() {
	const currentSettings = localStorage.getItem('settings');
	return currentSettings ? (JSON.parse(currentSettings) as Settings) : { hardMode: false, showTime: true };
}

export const settingsContext = createContext<{ settings: Settings; setSettings: (s: Settings) => void }>({ settings: getCurrentSettings(), setSettings: (s: Settings) => null });

function SettingsContextProvider({ children }: { children: React.ReactNode }) {
	const [settings, setSettings] = useState<Settings>(getCurrentSettings());

	useEffect(() => {
		if (settings) {
			localStorage.setItem('settings', JSON.stringify(settings));
		}
	}, [settings]);

	return <settingsContext.Provider value={{ settings, setSettings }}>{children}</settingsContext.Provider>;
}

function SettingsMenu({ isOpen, setOpen }: { isOpen: boolean; setOpen: (isOpen: boolean) => void }) {
	const { settings, setSettings } = useContext(settingsContext);

	function updateHardModeSetting(enabled: boolean) {
		setSettings({ ...settings, hardMode: enabled });
	}

	function updateShowTimeSetting(enabled: boolean) {
		setSettings({ ...settings, showTime: enabled });
	}

	return (
		<div>
			<div className={cx('fixed left-0 h-screen w-screen bg-black transition-all', isOpen ? 'top-0 opacity-40' : '-top-full opacity-0')} onClick={() => setOpen(false)}></div>
			<div className={cx('fixed top-0 h-full bg-gray-800 max-w-sm w-4/5 transition-all py-3 px-2 box-border text-white', isOpen ? 'left-0' : '-left-full')}>
				<h3 className="text-4xl text-center my-8">Settings</h3>

				<div className="mt-4 ml-2">
					<input type="checkbox" id="hardModeCheckbox" checked={settings.hardMode} onChange={(e) => updateHardModeSetting(e.target.checked)} />
					<label htmlFor="hardModeCheckbox" className="text-xl">
						Enable Hard Mode
					</label>
				</div>

				<div className="mt-4 ml-2">
					<input type="checkbox" id="showTimeCheckbox" checked={settings.showTime} onChange={(e) => updateShowTimeSetting(e.target.checked)} />
					<label htmlFor="showTimeCheckbox" className="text-xl">
						Show Time
					</label>
				</div>
			</div>
		</div>
	);
}

function App() {
	const {
		isLoading,
		isFetching,
		data: quote,
		refetch,
	} = useQuery(
		['quote'],
		({ signal }) => {
			return fetch('https://api.quotable.io/random?maxLength=180', { signal }).then((res) => res.json() as Promise<RandomQuoteResponse>);
		},
		{ refetchOnWindowFocus: false }
	);
	const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

	return (
		<SettingsContextProvider>
			<div
				onMouseMove={(e) => {
					(e.currentTarget.children[0] as HTMLDivElement).style.backgroundPosition = `${Math.round(e.clientX / -10)}px ${Math.round(e.clientY / -10)}px`;
				}}
			>
				<div className="App_background bg-gray-800 text-white h-screen">
					{isLoading || isFetching || !quote ? (
						<div className="h-full grid place-items-center">
							<LoadingSpinner />
						</div>
					) : (
						<Sentence content={quote.content} author={quote.author} refetch={refetch} />
					)}
				</div>
				<SettingsMenu isOpen={settingsOpen} setOpen={setSettingsOpen} />
				<button className="fixed top-0 left-0 w-4 h-4 m-4 grid place-items-center" onClick={() => setSettingsOpen((prev) => !prev)}>
					<FontAwesomeIcon className="hover:rotate-45 text-white hover:text-gray-200 transition-all" icon={faGear} size="xl" />
				</button>
			</div>
		</SettingsContextProvider>
	);
}

export default App;
