"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { PinPad } from "./PinPad";
import { useShiftStore } from "@/store/shift";
import type { Cashier } from "@/types/database";

type Step = "select" | "pin" | "opening_cash" | "shift_choice";

export function ShiftGate() {
	const router = useRouter();
	const { setCashierSession } = useShiftStore();
	const [step, setStep] = useState<Step>("select");
	const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
	const [openingCash, setOpeningCash] = useState("");
	const [loading, setLoading] = useState(false);
	const [activeShift, setActiveShift] = useState<{ id: string } | null>(null);

	const { data: cashiers } = useQuery<Cashier[]>({
		queryKey: ["cashiers-active"],
		queryFn: async () => {
			const res = await fetch("/api/cashiers");
			if (!res.ok) throw new Error("Failed to fetch cashiers");
			return res.json();
		},
	});

	const handleSelectCashier = (cashier: Cashier) => {
		setSelectedCashier(cashier);
		setStep(cashier.pin_hash ? "pin" : "opening_cash");
	};

	const handlePin = async (pin: string) => {
		setLoading(true);
		try {
			const res = await fetch("/api/auth/cashier", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cashierId: selectedCashier!.id, pin }),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error);
				return;
			}

			if (data.shiftId === "none") {
				const shiftRes = await fetch("/api/shifts/current");
				const shiftData = await shiftRes.json();
				if (shiftData?.id) {
					setActiveShift(shiftData);
					setStep("shift_choice");
				} else {
					setStep("opening_cash");
				}
			} else {
				setCashierSession(
					selectedCashier!.id,
					selectedCashier!.name,
					data.shiftId,
				);
				router.push("/pos/tables");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleStartShift = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/shifts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					openingCash: Number(openingCash) || 0,
					cashierId: selectedCashier!.id,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error);
				return;
			}
			setCashierSession(selectedCashier!.id, selectedCashier!.name, data.id);
			router.push("/pos/tables");
		} finally {
			setLoading(false);
		}
	};

	const handleJoinShift = async () => {
		if (!activeShift) return;
		setLoading(true);
		try {
			const res = await fetch(`/api/shifts/${activeShift.id}/join`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cashierId: selectedCashier!.id }),
			});
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error);
				return;
			}
			setCashierSession(
				selectedCashier!.id,
				selectedCashier!.name,
				activeShift.id,
			);
			router.push("/pos/tables");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#0a120e] flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<h1 className="font-[family-name:var(--font-cormorant)] text-5xl italic text-[#f59e0b] mb-2">
						Mahjong Royale
					</h1>
					<p className="text-[rgba(251,191,36,0.55)] text-sm">Staff Login</p>
				</div>

				{step === "select" && (
					<div className="space-y-3">
						<p className="text-center text-[rgba(254,249,236,0.7)] mb-4">
							Select your name to begin
						</p>
						{(cashiers ?? [])
							.filter((c) => c.is_active)
							.map((cashier) => (
								<button
									key={cashier.id}
									onClick={() => handleSelectCashier(cashier)}
									className="w-full py-4 px-6 rounded-xl bg-[rgba(20,36,28,0.85)] border border-[rgba(255,255,255,0.08)] text-[#fef9ec] text-left text-lg hover:border-[rgba(251,191,36,0.25)] hover:bg-[rgba(40,56,44,0.6)] transition-all"
								>
									{cashier.name}
								</button>
							))}
						<div className="pt-4 border-t border-[rgba(255,255,255,0.08)] mt-6">
							<a
								href="/login"
								className="text-center block text-xs text-[rgba(251,191,36,0.55)] hover:text-[#f59e0b] transition-colors"
							>
								Admin Login →
							</a>
						</div>
					</div>
				)}

				{step === "pin" && selectedCashier && (
					<div className="bg-[rgba(20,36,28,0.85)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6">
						<p className="text-center text-[#fef9ec] mb-2 text-lg">
							Welcome, {selectedCashier.name}
						</p>
						<p className="text-center text-[rgba(251,191,36,0.55)] text-sm mb-6">
							Enter your PIN
						</p>
						<PinPad onConfirm={handlePin} loading={loading} />
						<button
							onClick={() => setStep("select")}
							className="mt-4 w-full text-center text-xs text-[rgba(251,191,36,0.55)] hover:text-[#f59e0b]"
						>
							← Back
						</button>
					</div>
				)}

				{step === "opening_cash" && (
					<div className="bg-[rgba(20,36,28,0.85)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 space-y-4">
						<p className="text-center text-[#fef9ec] text-lg">
							Opening Cash Count
						</p>
						<p className="text-center text-[rgba(251,191,36,0.55)] text-sm">
							How much cash is in the drawer?
						</p>
						<input
							type="number"
							value={openingCash}
							onChange={(e) => setOpeningCash(e.target.value)}
							placeholder="0"
							className="w-full px-4 py-3 bg-[rgba(40,56,44,0.6)] border border-[rgba(255,255,255,0.08)] rounded-lg text-[#fef9ec] text-center text-2xl outline-none focus:border-[rgba(251,191,36,0.25)]"
						/>
						<button
							onClick={handleStartShift}
							disabled={loading}
							className="w-full py-3 bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold rounded-lg transition-colors disabled:opacity-50"
						>
							Start Shift
						</button>
						<button
							onClick={() => setStep("select")}
							className="w-full text-center text-xs text-[rgba(251,191,36,0.55)] hover:text-[#f59e0b]"
						>
							← Back
						</button>
					</div>
				)}

				{step === "shift_choice" && activeShift && (
					<div className="bg-[rgba(20,36,28,0.85)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-6 space-y-4">
						<p className="text-center text-[#fef9ec] text-lg">
							Active Shift Found
						</p>
						<p className="text-center text-[rgba(251,191,36,0.55)] text-sm">
							There's already a shift running
						</p>
						<button
							onClick={handleJoinShift}
							disabled={loading}
							className="w-full py-3 bg-[rgba(16,185,129,0.2)] border border-[rgba(16,185,129,0.4)] text-[#10b981] rounded-lg font-medium hover:bg-[rgba(16,185,129,0.3)] transition-colors"
						>
							Join Current Shift
						</button>
						<button
							onClick={() => setStep("opening_cash")}
							disabled={loading}
							className="w-full py-3 bg-[rgba(245,158,11,0.15)] border border-[rgba(251,191,36,0.25)] text-[#f59e0b] rounded-lg font-medium hover:bg-[rgba(245,158,11,0.25)] transition-colors"
						>
							Start New Shift
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
