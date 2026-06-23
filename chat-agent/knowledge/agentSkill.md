# DSL Page Builder Knowledge

## Component Validation Rules
1. Only use component types listed in the Component Registry.
2. Ensure all required properties are populated.
3. Form Component Mapping Rules:
   - Enforce `nameKeyId` usage in `Form` components.
   - Every child input component (`Input`, `Select`, `CheckboxGroup`) within a `Form` must reference the form's `nameKeyId` via their `name` property.
   - Patches that violate this linkage will be blocked.
