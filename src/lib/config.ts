import { createServiceClient } from "./supabase/server";

export interface AppConfig {
	place_name: string;
	currency: string;
	currency_symbol: string;
	timezone: string;
	hourly_rate: number;
	billing_mode: "block_hour" | "per_minute";
	qr_base_url: string;
	receipt_header_1: string;
	receipt_header_2: string;
	receipt_header_3: string;
	receipt_footer: string;
	receipt_paper_width: string;
	receipt_show_cogs: boolean;
	low_stock_threshold: number;
}

export const DEFAULT_CONFIG: AppConfig = {
	place_name: "Mahjong Royale",
	currency: "IDR",
	currency_symbol: "Rp",
	timezone: "Asia/Jakarta",
	hourly_rate: 50000,
	billing_mode: "block_hour",
	qr_base_url: "https://yourdomain.com/order",
	receipt_header_1: "Mahjong Royale",
	receipt_header_2: "Jl. Mahjong No. 1",
	receipt_header_3: "Tel: +62-XXX-XXXX-XXXX",
	receipt_footer: "Thank you for playing!",
	receipt_paper_width: "80mm",
	receipt_show_cogs: false,
	low_stock_threshold: 5,
};

export async function getConfig(): Promise<AppConfig> {
	const supabase = createServiceClient();
	const { data } = await supabase.from("config").select("*");

	if (!data) return DEFAULT_CONFIG;

	const map = Object.fromEntries(data.map((row) => [row.key, row.value]));

	return {
		place_name: map.place_name ?? DEFAULT_CONFIG.place_name,
		currency: map.currency ?? DEFAULT_CONFIG.currency,
		currency_symbol: map.currency_symbol ?? DEFAULT_CONFIG.currency_symbol,
		timezone: map.timezone ?? DEFAULT_CONFIG.timezone,
		hourly_rate: Number(map.hourly_rate ?? DEFAULT_CONFIG.hourly_rate),
		billing_mode:
			(map.billing_mode as AppConfig["billing_mode"]) ??
			DEFAULT_CONFIG.billing_mode,
		qr_base_url: map.qr_base_url ?? DEFAULT_CONFIG.qr_base_url,
		receipt_header_1: map.receipt_header_1 ?? DEFAULT_CONFIG.receipt_header_1,
		receipt_header_2: map.receipt_header_2 ?? DEFAULT_CONFIG.receipt_header_2,
		receipt_header_3: map.receipt_header_3 ?? DEFAULT_CONFIG.receipt_header_3,
		receipt_footer: map.receipt_footer ?? DEFAULT_CONFIG.receipt_footer,
		receipt_paper_width:
			map.receipt_paper_width ?? DEFAULT_CONFIG.receipt_paper_width,
		receipt_show_cogs: map.receipt_show_cogs === "true",
		low_stock_threshold: Number(
			map.low_stock_threshold ?? DEFAULT_CONFIG.low_stock_threshold,
		),
	};
}
