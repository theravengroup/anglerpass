import type {
  UseFormRegister,
  FieldErrors,
} from "react-hook-form";
import type { PropertyFormData } from "@/lib/validations/properties";

/**
 * Shared props passed from PropertyForm to each section component.
 * `register` and `errors` come from react-hook-form; `disabled` reflects
 * whether the form is currently saving/submitting.
 */
export interface PropertySectionProps {
  register: UseFormRegister<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  disabled: boolean;
}
