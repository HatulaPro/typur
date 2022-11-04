import { useQuery } from 'react-query';
import './App.css';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Sentence } from './components/Sentence';

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

function App() {
	const {
		isLoading,
		isFetching,
		data: quote,
		refetch,
	} = useQuery(
		['quote'],
		({ signal }) => {
			return fetch('https://api.quotable.io/random', { signal }).then((res) => res.json() as Promise<RandomQuoteResponse>);
		},
		{ refetchOnWindowFocus: false }
	);

	return (
		<div className="bg-gray-800 text-white h-screen">
			{isLoading || isFetching || !quote ? (
				<div className="h-full grid place-items-center">
					<LoadingSpinner />
				</div>
			) : (
				<Sentence content={quote.content} onSuccess={refetch} />
			)}
		</div>
	);
}

export default App;
