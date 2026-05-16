import { forwardRef } from "react";
import { fmtDate, fmtMoney } from "@/lib/formatters";
import type { Session, OrderWithMenuItem } from "@/types/database";

interface ReceiptTemplateProps {
	session: Session;
	orders: OrderWithMenuItem[];
	tableLabel: string;
	tableCharge: number;
	currencySymbol: string;
	config?: {
		receipt_header_1?: string;
		receipt_header_2?: string;
		receipt_header_3?: string;
		receipt_footer?: string;
	};
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
	(
		{ session, orders, tableLabel, tableCharge, currencySymbol, config },
		ref,
	) => {
		const fbTotal = orders
			.filter((o) => o.status === "confirmed")
			.reduce((sum, o) => sum + o.unit_price * o.quantity, 0);
		const grandTotal = tableCharge + fbTotal;

		return (
			<div
				ref={ref}
				id="receipt-root"
				style={{
					fontFamily: "monospace",
					fontSize: "12px",
					lineHeight: "1.5",
					width: "80mm",
					padding: "8px",
				}}
			>
				<div
					style={{
						textAlign: "center",
						borderBottom: "1px dashed #000",
						paddingBottom: "8px",
						marginBottom: "8px",
					}}
				>
					<div style={{ fontWeight: "bold", fontSize: "14px" }}>
						{config?.receipt_header_1 ?? "Mahjong Royale"}
					</div>
					{config?.receipt_header_2 && <div>{config.receipt_header_2}</div>}
					{config?.receipt_header_3 && <div>{config.receipt_header_3}</div>}
				</div>

				<div style={{ marginBottom: "8px" }}>
					<div>Date: {fmtDate(session.start_time)}</div>
					<div>Table: {tableLabel}</div>
					<div>Session: #{session.id.slice(0, 8).toUpperCase()}</div>
				</div>

				<div
					style={{
						borderTop: "1px dashed #000",
						paddingTop: "8px",
						marginBottom: "8px",
					}}
				>
					<div style={{ fontWeight: "bold" }}>TABLE TIME</div>
					{session.billing_mode === "block_hour" ? (
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span>Block-Hour × {session.blocks_purchased}</span>
							<span>{fmtMoney(tableCharge, currencySymbol)}</span>
						</div>
					) : (
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span>Per-Minute</span>
							<span>{fmtMoney(tableCharge, currencySymbol)}</span>
						</div>
					)}
				</div>

				{orders.length > 0 && (
					<div
						style={{
							borderTop: "1px dashed #000",
							paddingTop: "8px",
							marginBottom: "8px",
						}}
					>
						<div style={{ fontWeight: "bold" }}>F&B ORDERS</div>
						{orders.map((o) => (
							<div
								key={o.id}
								style={{ display: "flex", justifyContent: "space-between" }}
							>
								<span>
									{o.menu_items?.name ?? "Item"} × {o.quantity}
								</span>
								<span>
									{fmtMoney(o.unit_price * o.quantity, currencySymbol)}
								</span>
							</div>
						))}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginTop: "4px",
							}}
						>
							<span>F&B Subtotal</span>
							<span>{fmtMoney(fbTotal, currencySymbol)}</span>
						</div>
					</div>
				)}

				<div
					style={{
						borderTop: "1px dashed #000",
						paddingTop: "8px",
						marginBottom: "8px",
						fontWeight: "bold",
						fontSize: "14px",
						display: "flex",
						justifyContent: "space-between",
					}}
				>
					<span>GRAND TOTAL</span>
					<span>{fmtMoney(grandTotal, currencySymbol)}</span>
				</div>

				<div
					style={{
						textAlign: "center",
						borderTop: "1px dashed #000",
						paddingTop: "8px",
					}}
				>
					{config?.receipt_footer ?? "Thank you for playing!"}
				</div>
			</div>
		);
	},
);

ReceiptTemplate.displayName = "ReceiptTemplate";
