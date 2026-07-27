"use client";

import { ReorderControls } from "@/components/admin/ReorderControls";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { cn } from "@/utils/cn";

/**
 * Generic field type vocabulary for this editor — deliberately its own
 * union, not `FeedbackFormField["type"]` from the (not-yet-built) Feedback
 * Forms module. Keeping the two separate is what makes this component
 * reusable: a future Feedback Forms builder maps between the two shapes at
 * its own boundary instead of this component importing that module's types.
 */
export type DynamicFieldType = "text" | "paragraph" | "radio" | "checkbox" | "rating" | "dropdown" | "yes_no";

export interface DynamicField {
  /** Stable client-side identity for React keys and reordering — not necessarily a consumer's persisted field key. */
  id: string;
  label: string;
  type: DynamicFieldType;
  /** Choices for radio/checkbox/dropdown fields; ignored for other types. */
  options?: string[];
  required: boolean;
}

export interface DynamicFieldListEditorFieldErrors {
  label?: string;
  options?: string;
}

export type DynamicFieldListEditorErrors = Record<string, DynamicFieldListEditorFieldErrors>;

export interface DynamicFieldListEditorProps {
  fields: DynamicField[];
  onChange: (fields: DynamicField[]) => void;
  disabled?: boolean;
  loading?: boolean;
  errors?: DynamicFieldListEditorErrors;
  className?: string;
}

const FIELD_TYPE_OPTIONS: { value: DynamicFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "paragraph", label: "Paragraph" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "rating", label: "Rating" },
  { value: "dropdown", label: "Dropdown" },
  { value: "yes_no", label: "Yes/No" },
];

const TYPES_WITH_OPTIONS: DynamicFieldType[] = ["radio", "checkbox", "dropdown"];

function createFieldId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `field-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Builds a blank field ready to append — exported so consumers' "+ Add Field" affordance can share the same default shape. */
export function createDynamicField(overrides?: Partial<DynamicField>): DynamicField {
  return {
    id: createFieldId(),
    label: "",
    type: "text",
    required: false,
    ...overrides,
  };
}

/**
 * Reusable add/remove/reorder/edit list editor for form-builder-style field
 * definitions. Generalizes the array add/remove/reorder idiom `WorkshopForm`
 * hand-rolls per array (doctors/benefits/agenda/faq) into one component, so
 * the (future, out-of-scope) Feedback Form builder doesn't repeat it a
 * fourth time.
 */
export function DynamicFieldListEditor({
  fields,
  onChange,
  disabled = false,
  loading = false,
  errors,
  className,
}: DynamicFieldListEditorProps) {
  const isDisabled = disabled || loading;

  function updateField(id: string, patch: Partial<DynamicField>) {
    onChange(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  }

  function removeField(id: string) {
    onChange(fields.filter((field) => field.id !== id));
  }

  function addField() {
    onChange([...fields, createDynamicField()]);
  }

  function moveField(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    onChange(next);
  }

  function updateOption(field: DynamicField, optionIndex: number, value: string) {
    const options = [...(field.options ?? [])];
    options[optionIndex] = value;
    updateField(field.id, { options });
  }

  function addOption(field: DynamicField) {
    updateField(field.id, { options: [...(field.options ?? []), ""] });
  }

  function removeOption(field: DynamicField, optionIndex: number) {
    updateField(field.id, { options: (field.options ?? []).filter((_, i) => i !== optionIndex) });
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {fields.map((field, index) => {
        const fieldErrors = errors?.[field.id];
        const showOptions = TYPES_WITH_OPTIONS.includes(field.type);

        return (
          <Card key={field.id} className="p-5">
            <div className="flex items-start gap-4">
              <ReorderControls
                className="mt-9"
                canMoveUp={index > 0}
                canMoveDown={index < fields.length - 1}
                disabled={isDisabled}
                onMoveUp={() => moveField(index, -1)}
                onMoveDown={() => moveField(index, 1)}
              />

              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Question / Label"
                  value={field.label}
                  disabled={isDisabled}
                  error={fieldErrors?.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  placeholder="How was your experience?"
                />
                <Select
                  label="Field Type"
                  options={FIELD_TYPE_OPTIONS}
                  value={field.type}
                  disabled={isDisabled}
                  onChange={(e) => {
                    const nextType = e.target.value as DynamicFieldType;
                    const nextOptions = TYPES_WITH_OPTIONS.includes(nextType)
                      ? field.options?.length
                        ? field.options
                        : ["", ""]
                      : undefined;
                    updateField(field.id, { type: nextType, options: nextOptions });
                  }}
                />

                {showOptions && (
                  <div className="md:col-span-2">
                    <span className="mb-2 block font-semibold text-ink">Options</span>
                    <div className="flex flex-col gap-2">
                      {(field.options ?? []).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <Input
                            className="flex-1"
                            value={option}
                            disabled={isDisabled}
                            onChange={(e) => updateOption(field, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDisabled || (field.options?.length ?? 0) <= 2}
                            onClick={() => removeOption(field, optionIndex)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2"
                      disabled={isDisabled}
                      onClick={() => addOption(field)}
                    >
                      + Add Option
                    </Button>
                    {fieldErrors?.options && (
                      <p role="alert" className="mt-1.5 text-sm text-red-600">
                        {fieldErrors.options}
                      </p>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-3 font-semibold text-ink">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-primary"
                    checked={field.required}
                    disabled={isDisabled}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  />
                  Required
                </label>
              </div>

              <Button type="button" variant="ghost" size="sm" disabled={isDisabled} onClick={() => removeField(field.id)}>
                Remove
              </Button>
            </div>
          </Card>
        );
      })}

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" disabled={isDisabled} onClick={addField}>
          + Add Field
        </Button>
        {loading && <Loader size="sm" />}
      </div>
    </div>
  );
}
