"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const supabase = createClient();
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) {
				toast.error(error.message);
				return;
			}
			router.push("/admin");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#0a120e] flex items-center justify-center p-6">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="font-[family-name:var(--font-cormorant)] text-5xl italic text-[#f59e0b] mb-2">
						Mahjong Royale
					</h1>
					<p className="text-[rgba(251,191,36,0.55)] text-sm">Admin Login</p>
				</div>

				<form
					onSubmit={handleLogin}
					className="bg-[rgba(20,36,28,0.85)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 space-y-4"
				>
					<div>
						<label className="block text-xs text-[rgba(251,191,36,0.55)] mb-2">
							Email
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full px-4 py-3 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#fef9ec] outline-none focus:border-[rgba(251,191,36,0.25)] transition-colors"
						/>
					</div>
					<div>
						<label className="block text-xs text-[rgba(251,191,36,0.55)] mb-2">
							Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full px-4 py-3 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#fef9ec] outline-none focus:border-[rgba(251,191,36,0.25)] transition-colors"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold rounded-lg transition-colors disabled:opacity-50"
					>
						{loading ? "Signing in…" : "Sign In"}
					</button>
				</form>

				<div className="mt-4 text-center">
					<a
						href="/"
						className="text-xs text-[rgba(251,191,36,0.55)] hover:text-[#f59e0b] transition-colors"
					>
						← Back to Staff Login
					</a>
				</div>
			</div>
		</div>
	);
}
