import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { getRlsTestEnv, type RlsTestEnv } from "@tests/fixtures/env";
import { beforeAll, describe, expect, it } from "vitest";

const rlsEnv = getRlsTestEnv();

function createTestClient(env: RlsTestEnv): SupabaseClient {
	return createClient(env.url, env.anonKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	});
}

describe.skipIf(!rlsEnv)("RLS bike policies (integration)", () => {
	let client: SupabaseClient;

	beforeAll(() => {
		if (!rlsEnv) return;
		client = createTestClient(rlsEnv);
	});

	it("allows anonymous read of available listings", async () => {
		if (!rlsEnv) return;

		const { error } = await client
			.from("bike_listings")
			.select("id")
			.eq("status", "available")
			.limit(1);

		expect(error).toBeNull();
	});

	it("denies anonymous insert on bike_listings", async () => {
		if (!rlsEnv) return;

		const { error } = await client.from("bike_listings").insert({
			year: 2099,
			make: "Test",
			model: "RLS",
			price: 1,
			mileage: 0,
			status: "draft",
		});

		expect(error).not.toBeNull();
	});

	it("denies customer insert on bike_listings", async () => {
		if (!rlsEnv) return;

		const { error: signInError } = await client.auth.signInWithPassword(
			rlsEnv.customer,
		);
		expect(signInError).toBeNull();

		const { error } = await client.from("bike_listings").insert({
			year: 2099,
			make: "Test",
			model: "CustomerRLS",
			price: 1,
			mileage: 0,
			status: "draft",
		});

		await client.auth.signOut();
		expect(error).not.toBeNull();
	});

	it("denies customer delete on bike_listings", async () => {
		if (!rlsEnv) return;

		const { error: signInError } = await client.auth.signInWithPassword(
			rlsEnv.customer,
		);
		expect(signInError).toBeNull();

		const { data } = await client
			.from("bike_listings")
			.select("id")
			.neq("status", "draft")
			.limit(1)
			.single();

		if (!data) {
			await client.auth.signOut();
			return;
		}

		const { error } = await client
			.from("bike_listings")
			.delete()
			.eq("id", data.id);

		await client.auth.signOut();
		expect(error).not.toBeNull();
	});

	it("allows admin insert and delete on draft bike_listings", async () => {
		if (!rlsEnv) return;

		const { error: signInError } = await client.auth.signInWithPassword(
			rlsEnv.admin,
		);
		expect(signInError).toBeNull();

		const { data: inserted, error: insertError } = await client
			.from("bike_listings")
			.insert({
				year: 2099,
				make: "Test",
				model: "AdminRLS",
				price: 1,
				mileage: 0,
				status: "draft",
				description: "RLS integration test row — safe to delete",
			})
			.select("id")
			.single();

		expect(insertError).toBeNull();
		expect(inserted).not.toBeNull();
		if (!inserted) return;

		const { error: deleteError } = await client
			.from("bike_listings")
			.delete()
			.eq("id", inserted.id);

		await client.auth.signOut();
		expect(deleteError).toBeNull();
	});
});
