import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getSeats() {
  const res = await fetch("http://127.0.0.1:8000/api/v1/seats/?limit=50", { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

export default async function SeatsPage() {
  let seats = [];
  try {
    seats = await getSeats();
  } catch (error) {
    return <div className="p-8 text-red-500">Error connecting to the API. Is FastAPI running?</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Seating Matrix</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Workspace Allocation (First 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seat Number</TableHead>
                <TableHead>Floor ID</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {seats.map((seat: any) => (
                <TableRow key={seat.id}>
                  <TableCell className="font-medium">{seat.seat_number}</TableCell>
                  <TableCell>{seat.floor_id}</TableCell>
                  <TableCell>{seat.zone || "N/A"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${seat.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {seat.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {seats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No seats found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
