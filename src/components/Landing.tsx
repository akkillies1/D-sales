import React from 'react';

interface LandingProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onSignIn, isLoading }) => {
  return (
	<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#070708] to-[#050506] text-[#E6E6E9] p-6">
	  <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
		{/* Left: Hero */}
		<div className="space-y-6">
		  <div className="flex items-center gap-3">
			<div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">D</div>
			<div>
			  <h1 className="text-3xl sm:text-4xl font-extrabold">D-sales Pro</h1>
			  <p className="text-sm text-zinc-400">Turn Google Sheets into a lightweight CRM for teams.</p>
			</div>
		  </div>

		  <h2 className="text-3xl sm:text-4xl font-bold leading-tight">Manage leads, follow-ups and analytics — directly from your Google Sheets.</h2>

		  <p className="text-zinc-400 max-w-xl">Connect any spreadsheet and get Kanban, table, follow-ups and analytics with two-way sync. No migrations — your data stays in Google Sheets.</p>

		  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
			<button
			  onClick={onSignIn}
			  disabled={isLoading}
			  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 px-6 py-3 rounded-lg text-white font-semibold shadow-2xl"
			>
			  {isLoading ? 'Signing in...' : 'Sign in with Google'}
			</button>

			<div className="flex items-center gap-4">
			  <a href="/privacy" className="text-sm text-zinc-400 hover:underline">Privacy</a>
			  <a href="/cookies" className="text-sm text-zinc-400 hover:underline">Cookies</a>
			</div>
		  </div>

		  <div className="mt-6 text-xs text-zinc-500 space-y-1">
			<div>Powered by dcode private ltd</div>
			<div className="mt-1">Secure, auditable access to your Google Sheets — only when you consent.</div>
		  </div>
		</div>

		{/* Right: Features / Preview */}
		<div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
		  <div className="flex items-center justify-between mb-4">
			<div>
			  <div className="text-sm text-zinc-300 font-medium">Features</div>
			  <div className="text-xs text-zinc-500">What you get</div>
			</div>
			<div className="text-xs text-zinc-500">No setup • 2-way sync</div>
		  </div>

		  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
			<div className="p-3 bg-[#0c0c0e] rounded shadow-inner text-xs">
			  <div className="font-semibold">Kanban & Pipeline</div>
			  <div className="text-zinc-400 text-[13px]">Drag leads through stages and update Sheets automatically.</div>
			</div>
			<div className="p-3 bg-[#0c0c0e] rounded shadow-inner text-xs">
			  <div className="font-semibold">Auto Sync</div>
			  <div className="text-zinc-400 text-[13px]">Periodic polling keeps your dashboard in sync with team edits.</div>
			</div>
			<div className="p-3 bg-[#0c0c0e] rounded shadow-inner text-xs">
			  <div className="font-semibold">Follow-ups</div>
			  <div className="text-zinc-400 text-[13px]">Schedule and export follow-up reminders to Calendar.</div>
			</div>
			<div className="p-3 bg-[#0c0c0e] rounded shadow-inner text-xs">
			  <div className="font-semibold">Analytics</div>
			  <div className="text-zinc-400 text-[13px]">Funnel metrics and location breakdowns at a glance.</div>
			</div>
		  </div>

		  <div className="rounded-lg border border-zinc-800 p-3 bg-black/40">
			<div className="h-48 md:h-56 bg-gradient-to-br from-[#060607] to-[#0d0d0f] rounded flex items-center justify-center text-zinc-400 text-sm">Live dashboard preview after sign in</div>
		  </div>
		</div>
	  </div>
	</div>
  );
};

export default Landing;
