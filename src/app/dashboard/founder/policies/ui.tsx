"use client";

// Server actions removed for static export. UI actions are now stubs.
export async function updatePoliciesStub() {
	alert("Update policies action is not available in static export.");
}


type Policy = {
	marginFloorPct?: number;
	maxDiscountPct?: number;
	lockdownMode?: boolean;
};

export default function PolicyForm({ policy }: { policy: Policy }) {
	async function onSubmit() {
		try {
			await updatePoliciesStub();
		} finally {
			// Action complete
		}
	}

	return (
		<div className="rounded-3xl bg-background text-slate-900 p-6 shadow-sm">
			<div className="text-2xl font-semibold">Policies</div>
			<div className="text-sm text-neutral-600">
				Margin/discount/lockdown policies (static export stub).
			</div>
			<form action={onSubmit} className="mt-6 space-y-4">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<label className="space-y-1">
						<div className="text-sm font-medium">Margin Floor (%)</div>
						<input
							name="marginFloorPct"
							type="number"
							className="w-full rounded-2xl border px-3 py-2 text-sm"
							defaultValue={policy.marginFloorPct ?? ""}
							disabled
						/>
					</label>
					<label className="space-y-1">
						<div className="text-sm font-medium">Max Discount (%)</div>
						<input
							name="maxDiscountPct"
							type="number"
							className="w-full rounded-2xl border px-3 py-2 text-sm"
							defaultValue={policy.maxDiscountPct ?? ""}
							disabled
						/>
					</label>
				</div>
				<label className="flex items-center gap-2">
					<input
						name="lockdownMode"
						type="checkbox"
						className="rounded"
						defaultChecked={policy.lockdownMode}
						disabled
					/>
					<span className="text-sm">Lockdown Mode</span>
				</label>
				<button
					disabled
					className="rounded-2xl bg-neutral-900 px-5 py-2 text-sm text-neutral-100 opacity-50"
				>
					Save Policies (disabled)
				</button>
			</form>
		</div>
	);
}
