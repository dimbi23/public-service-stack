"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Form } from "@/payload-types";

interface FormSubmissionProps {
	form: Form;
	serviceSlug: string;
}

export function FormSubmission({ form, serviceSlug }: FormSubmissionProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<Record<string, string | boolean>>(
		{}
	);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setErrors({});

		// Validate required fields
		const newErrors: Record<string, string> = {};
		form.fields?.forEach((field) => {
			if (
				"required" in field &&
				field.required &&
				"name" in field &&
				!formData[field.name]
			) {
				newErrors[field.name] = "This field is required";
			}
		});

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setIsSubmitting(false);
			return;
		}

		try {
			// Prepare submission data in Payload format
			const submissionData = Object.entries(formData).map(
				([field, value]) => ({
					field,
					value: String(value),
				})
			);

			const response = await fetch("/api/form-submissions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					form: form.id,
					submissionData,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Failed to submit form");
			}

			const result = await response.json();

			// Wait a moment for the application to be created by the afterChange hook
			// Then fetch the application to get the tracking ID
			// Poll for the application (hook creates it asynchronously)
			let attempts = 0;
			const maxAttempts = 10;
			const pollInterval = 500;

			const pollForApplication = async () => {
				try {
					const appResponse = await fetch(
						`/api/application-by-submission?submissionId=${result.doc.id}`
					);
					if (appResponse.ok) {
						const appData = await appResponse.json();
						if (appData.trackingId) {
							router.push(
								`/application/confirmation?trackingId=${appData.trackingId}`
							);
							return;
						}
					}
				} catch (err) {
					console.error("Error fetching tracking ID:", err);
				}

				attempts++;
				if (attempts < maxAttempts) {
					setTimeout(pollForApplication, pollInterval);
				} else {
					// Fallback: redirect to confirmation with submission ID
					router.push(
						`/application/confirmation?submissionId=${result.doc.id}`
					);
				}
			};

			setTimeout(pollForApplication, pollInterval);
		} catch (error) {
			setErrors({
				submit:
					error instanceof Error
						? error.message
						: "Failed to submit form",
			});
			setIsSubmitting(false);
		}
	};

	const handleChange = (
		name: string,
		value: string | boolean,
		type: string
	) => {
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? value : value,
		}));
	};

	const renderField = (
		field: NonNullable<Form["fields"]>[number],
		index: number
	) => {
		if (!(field && "blockType" in field)) return null;

		const fieldName = "name" in field ? field.name : `field-${index}`;
		const value = formData[fieldName] || "";
		const error = errors[fieldName];

		switch (field.blockType) {
			case "text":
				return (
					<div className="mb-4" key={field.id || fieldName}>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor={fieldName}
						>
							{field.label || fieldName}
							{field.required && (
								<span className="text-red-500"> *</span>
							)}
						</label>
						<Input
							id={fieldName}
							name={fieldName}
							onChange={(e) =>
								handleChange(fieldName, e.target.value, "text")
							}
							placeholder={
								"placeholder" in field && field.placeholder
									? String(field.placeholder)
									: ""
							}
							required={
								"required" in field ? (field.required ?? false) : false
							}
							type="text"
							value={typeof value === "string" ? value : ""}
						/>
						{error && (
							<p className="mt-1 text-red-500 text-sm">{error}</p>
						)}
					</div>
				);

			case "email":
				return (
					<div className="mb-4" key={field.id || fieldName}>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor={fieldName}
						>
							{field.label || fieldName}
							{field.required && (
								<span className="text-red-500"> *</span>
							)}
						</label>
						<Input
							id={fieldName}
							name={fieldName}
							onChange={(e) =>
								handleChange(fieldName, e.target.value, "email")
							}
							placeholder={
								"placeholder" in field && field.placeholder
									? String(field.placeholder)
									: ""
							}
							required={
								"required" in field ? (field.required ?? false) : false
							}
							type="email"
							value={typeof value === "string" ? value : ""}
						/>
						{error && (
							<p className="mt-1 text-red-500 text-sm">{error}</p>
						)}
					</div>
				);

			case "textarea":
				return (
					<div className="mb-4" key={field.id || fieldName}>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor={fieldName}
						>
							{field.label || fieldName}
							{field.required && (
								<span className="text-red-500"> *</span>
							)}
						</label>
						<textarea
							className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							id={fieldName}
							name={fieldName}
							onChange={(e) =>
								handleChange(
									fieldName,
									e.target.value,
									"textarea"
								)
							}
							placeholder={
								"placeholder" in field && field.placeholder
									? String(field.placeholder)
									: ""
							}
							required={
								"required" in field ? (field.required ?? false) : false
							}
							value={typeof value === "string" ? value : ""}
						/>
						{error && (
							<p className="mt-1 text-red-500 text-sm">{error}</p>
						)}
					</div>
				);

			case "select":
				return (
					<div className="mb-4" key={field.id || fieldName}>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor={fieldName}
						>
							{field.label || fieldName}
							{field.required && (
								<span className="text-red-500"> *</span>
							)}
						</label>
						<Select
							onValueChange={(val) =>
								handleChange(fieldName, val, "select")
							}
							required={field.required ?? false}
							value={typeof value === "string" ? value : ""}
						>
							<SelectTrigger id={fieldName}>
								<SelectValue placeholder="Select an option" />
							</SelectTrigger>
							<SelectContent>
								{field.options?.map(
									(option: {
										id?: string | null;
										value: string;
										label: string;
									}) => (
										<SelectItem
											key={option.id || option.value}
											value={option.value}
										>
											{option.label}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
						{error && (
							<p className="mt-1 text-red-500 text-sm">{error}</p>
						)}
					</div>
				);

			case "checkbox":
				return (
					<div
						className="mb-4 flex items-center space-x-2"
						key={field.id || fieldName}
					>
						<Checkbox
							checked={formData[fieldName] === true}
							id={fieldName}
							onCheckedChange={(checked) =>
								handleChange(
									fieldName,
									checked === true,
									"checkbox"
								)
							}
						/>
						<label
							className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							htmlFor={fieldName}
						>
							{field.label || fieldName}
							{field.required && (
								<span className="text-red-500"> *</span>
							)}
						</label>
						{error && (
							<p className="mt-1 text-red-500 text-sm">{error}</p>
						)}
					</div>
				);

			case "number":
				return (
					<div className="mb-4" key={field.id || fieldName}>
						<label
							className="mb-2 block font-medium text-sm"
							htmlFor={fieldName}
						>
							{field.label || fieldName}
							{field.required && (
								<span className="text-red-500"> *</span>
							)}
						</label>
						<Input
							id={fieldName}
							name={fieldName}
							onChange={(e) =>
								handleChange(
									fieldName,
									e.target.value,
									"number"
								)
							}
							placeholder={
								"placeholder" in field && field.placeholder
									? String(field.placeholder)
									: ""
							}
							required={
								"required" in field ? (field.required ?? false) : false
							}
							type="number"
							value={typeof value === "string" ? value : ""}
						/>
						{error && (
							<p className="mt-1 text-red-500 text-sm">{error}</p>
						)}
					</div>
				);

			case "message":
				return (
					<div className="mb-4" key={field.id || fieldName}>
						{field.message && (
							<div
								className="rounded-lg bg-muted p-4"
								dangerouslySetInnerHTML={{
									__html: "Message field - content rendering needed",
								}}
							/>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			{form.fields && Array.isArray(form.fields)
				? form.fields.map((field, index) => renderField(field, index))
				: null}

			{errors.submit && (
				<div className="rounded-lg bg-red-50 p-4 text-red-800">
					{errors.submit}
				</div>
			)}

			<Button
				className="w-full"
				disabled={isSubmitting}
				size="lg"
				type="submit"
			>
				{isSubmitting
					? "Submitting..."
					: form.submitButtonLabel || "Submit"}
			</Button>
		</form>
	);
}
