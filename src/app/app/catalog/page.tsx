"use client";
import React, { useState } from "react";
import ProductsPage from "../products/page";
import UploadProductButton from "../../../components/UploadProductButton";

export default function CatalogPage() {
	const [seeding, setSeeding] = useState(false);
	const [seeded, setSeeded] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSeedAccessories = async () => {
		setSeeding(true);
		setError(null);
		try {
			const res = await fetch("/api/seed-catalogs?type=accessories", { method: "POST" });
			if (!res.ok) throw new Error("Failed to seed accessories catalog");
			setSeeded(true);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setSeeding(false);
		}
	};

	return (
		<div>
			<div className="mb-4 flex gap-2 items-center">
				<button
					className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
					onClick={handleSeedAccessories}
					disabled={seeding}
				>
					{seeding ? "Seeding..." : "Seed Accessories Catalog"}
				</button>
				{error && <span className="text-red-600 ml-2">{error}</span>}
			</div>
			<ProductsPage />
		</div>
	);
}
