"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewEmployeePage() {
  const [formData, setFormData] = useState({
    employee_code: "",
    name: "",
    email: "",
    designation: "",
    department_id: "",
  });
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/employees/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // MOCK TOKEN FOR DEMO: In production, pass authenticated Admin JWT token here
          "Authorization": "Bearer MOCK_TOKEN"
        },
        body: JSON.stringify({
          ...formData,
          department_id: formData.department_id ? parseInt(formData.department_id) : null
        })
      });
      if (res.ok) {
        setStatus("Employee added successfully!");
        setFormData({ employee_code: "", name: "", email: "", designation: "", department_id: "" });
      } else {
        const err = await res.json();
        setStatus(`Error: ${JSON.stringify(err)}`);
      }
    } catch (err) {
      setStatus("Error calling API. Did you disable backend Auth for testing, or is it offline?");
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add New Employee</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Employee Code</Label>
                <Input id="code" required value={formData.employee_code} onChange={e => setFormData({...formData, employee_code: e.target.value})} placeholder="EMP001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@seatflow.ai" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation / Role</Label>
                <Input id="designation" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} placeholder="Software Engineer" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department ID (Optional)</Label>
              <Input id="department" type="number" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})} placeholder="e.g. 1" />
            </div>
            
            <Button type="submit" className="w-full">Create Employee Record</Button>
            {status && <p className="text-sm mt-2 font-semibold">{status}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
