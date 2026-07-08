import { redirect } from "next/navigation";

// Redirect /employees/new to /employees (modal-based creation)
export default function NewEmployeePage() {
  redirect("/employees");
}
