// src/actions/contact.ts
"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ContactFormData {
	name: string;
	phone: string;
	email: string;
	year: string;
	make: string;
	model: string;
	selectedService: string;
	message: string;
}

export async function sendContactEmail(formData: ContactFormData) {
	try {
		const { name, phone, email, year, make, model, selectedService, message } =
			formData;

		const { error } = await resend.emails.send({
			from: "onboarding@resend.dev",
			to: "leframba@usfca.edu",
			replyTo: email,
			subject: `New Shop Inquiry: ${make} ${model} - ${name}`,
			html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">New Service Inquiry</h2>
                    <p><strong>Customer:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <hr style="border-color: #eee; margin: 20px 0;" />
                    <p><strong>Bike:</strong> ${year} ${make} ${model}</p>
                    <p><strong>Requested Service:</strong> ${selectedService || "Not Sure / Diagnostic"}</p>
                    <h3 style="margin-top: 20px;">Additional Notes:</h3>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
                        <p style="margin: 0;">${message || "No additional notes provided."}</p>
                    </div>
                </div>
            `,
		});

		if (error) {
			console.error("Resend Error:", error);
			return {
				success: false,
				error: "Failed to send email. Please try again.",
			};
		}

		return { success: true };
	} catch (error) {
		console.error("Server Action Error:", error);
		return { success: false, error: "An unexpected error occurred." };
	}
}
