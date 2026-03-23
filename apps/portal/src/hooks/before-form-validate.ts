import type { CollectionBeforeValidateHook } from "payload";
import type { Form } from "@/payload-types";
import { generateSchemaFromForm } from "@/utilities/file-to-schema";

export const beforeFormValidateHook: CollectionBeforeValidateHook<Form> = ({
	data,
}) => {
	if (data) {
		data.schema = generateSchemaFromForm(data as Form);
	}

	return data;
};
