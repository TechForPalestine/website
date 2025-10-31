import { FormProvider as Form } from "react-hook-form";
import type { UseFormReturn, SubmitHandler } from "react-hook-form";

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
  methods: UseFormReturn<any>;
  onSubmit?: SubmitHandler<any>;
};

export default function FormProvider({ children, onSubmit, methods }: Props) {
  return (
    <Form {...methods}>
      <form
        onSubmit={(e) => {
          console.log("🔥 Form submit event triggered!");
          methods.handleSubmit(
            onSubmit ?? (() => {}),
            (errors) => console.log("❌ Validation Errors:", errors) // Log errors
          )(e);
        }}
      >
        {children}
      </form>
    </Form>
  );
}
