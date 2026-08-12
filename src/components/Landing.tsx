import React from 'react';

interface LandingProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onSignIn, isLoading }) => {
  return (
	<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#070708] to-[#0b0b0c] text-[#E4E4E7] p-6">
	  <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
		<div className="space-y-6">
		  <div className="flex items-center gap-3">
			<div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">D</div>
			<div>
			  <h1 className="text-3xl sm:text-4xl font-extrabold">D-sales Pro</h1>
			  <p className="text-sm text-zinc-400">Google Sheets CRM & Sales Dashboard for small teams</p>
			</div>
		  </div>

		  <h2 className="text-2xl sm:text-3xl font-bold">Turn Google Sheets into a simple CRM — no setup, instant sync.</h2>

		  <p className="text-zinc-400 max-w-xl">Connect your Google Sheet in one click and get a lightweight CRM with kanban, follow-ups, analytics and team sync. Built for speed and easy collaboration.</p>

		  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
			<button
			  onClick={onSignIn}
			  disabled={isLoading}
			  className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-lg text-white font-semibold shadow-lg"
			>
			  {isLoading ? 'Signing in...' : 'Sign in with Google'}
			</button>

			<a href="/privacy" className="text-sm text-zinc-400 hover:underline">Privacy</a>
			<a href="/cookies" className="text-sm text-zinc-400 hover:underline">Cookies</a>
		  </div>

		  <div className="mt-6 text-xs text-zinc-500">
			<div>Powered by dcode private ltd</div>
			<div className="mt-2">Works with your Google account — your data stays in Google Sheets.</div>
		  </div>
		</div>

		<div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
		  <div className="text-sm text-zinc-300 font-medium mb-3">Live Preview</div>
		  <div className="bg-[#0d0d0f] rounded-lg p-4">
			<div className="h-60 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 flex flex-col">
			  <div className="flex items-center justify-between mb-3">
				<div className="font-semibold">Lead Pipeline</div>
				<div className="text-[10px] text-zinc-500">Demo</div>
			  </div>
			  <div className="flex-1 overflow-auto">
				<div className="grid grid-cols-3 gap-3">
				  <div className="p-2 bg-zinc-900 rounded">New Inquiry</div>
				  <div className="p-2 bg-zinc-900 rounded">Estimate submitted</div>
				  <div className="p-2 bg-zinc-900 rounded">Work awarded</div>
				</div>
			  </div>
			  <div className="mt-3 text-[11px] text-zinc-500">Connect your Google Sheet after sign in to load data.</div>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  );
};

export default Landing;
