import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Armchair, BarChart2 } from "lucide-react";

async function getMetrics() {
  const res = await fetch("http://localhost:8000/api/v1/dashboard/metrics", { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

export default async function DashboardPage() {
  let data;
  try {
    data = await getMetrics();
  } catch (error) {
    return <div className="p-8 text-red-500">Error connecting to the API. Make sure the FastAPI backend is running!</div>;
  }

  const { widgets, charts } = data;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.total_employees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seat Utilization</CardTitle>
            <Armchair className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.seat_utilization_pct}%</div>
            <p className="text-xs text-muted-foreground">{widgets.occupied_seats} occupied out of {widgets.total_seats}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.total_projects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{widgets.total_departments}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {charts.department_distribution.map((dept: any) => (
                <li key={dept.name} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{dept.name}</span>
                  <span className="font-bold">{dept.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Project Distribution</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="space-y-4">
              {charts.project_distribution.map((proj: any) => (
                <li key={proj.name} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{proj.name}</span>
                  <span className="font-bold">{proj.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
