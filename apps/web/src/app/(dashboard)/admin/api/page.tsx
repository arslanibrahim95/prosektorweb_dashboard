import { redirect } from "next/navigation";

export default function ApiManagementPage() {
    redirect("/admin/api-keys");
}
