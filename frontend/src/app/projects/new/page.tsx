import { redirect } from "next/navigation";

// Redirect /projects/new to /projects (creation via API)
export default function NewProjectPage() {
  redirect("/projects");
}
