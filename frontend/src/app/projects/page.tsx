import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getProjects() {
  const res = await fetch("http://localhost:8000/api/v1/projects/?limit=50", { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

export default async function ProjectsPage() {
  let projects = [];
  try {
    projects = await getProjects();
  } catch (error) {
    return <div className="p-8 text-red-500">Error connecting to the API. Is FastAPI running?</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Projects (First 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((proj: any) => (
                <TableRow key={proj.id}>
                  <TableCell>{proj.id}</TableCell>
                  <TableCell className="font-medium">{proj.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                      {proj.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(proj.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No projects found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
