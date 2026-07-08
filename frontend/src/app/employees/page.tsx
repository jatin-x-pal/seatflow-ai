import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getEmployees() {
  const res = await fetch("http://localhost:8000/api/v1/employees/?limit=50", { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

export default async function EmployeesPage() {
  let employees = [];
  try {
    employees = await getEmployees();
  } catch (error) {
    return <div className="p-8 text-red-500">Error connecting to the API. Is FastAPI running?</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Employees Directory</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>All Employees (First 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department ID</TableHead>
                <TableHead>Project ID</TableHead>
                <TableHead>Seat ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.employee_code}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.designation || "N/A"}</TableCell>
                  <TableCell>{emp.department_id || "Unassigned"}</TableCell>
                  <TableCell>{emp.project_id || "Unassigned"}</TableCell>
                  <TableCell>{emp.seat_id ? `Seat #${emp.seat_id}` : "Unallocated"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                      {emp.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {employees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-4">No employees found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
