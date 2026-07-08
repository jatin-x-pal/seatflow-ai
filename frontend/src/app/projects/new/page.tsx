"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewProjectPage() {
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    manager: "",
    technology: "",
    status: "Active"
  });
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Submitting...");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/projects/", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": "Bearer MOCK_TOKEN"
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMsg("Project generated successfully!");
        setFormData({ name: "", client: "", manager: "", technology: "", status: "Active" });
      } else {
        const err = await res.json();
        setMsg(`Error: ${JSON.stringify(err)}`);
      }
    } catch (err) {
      setMsg("Error calling API. Did you disable backend Auth for testing, or is it offline?");
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
      <Card>
        <CardHeader>
          <CardTitle>Project Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Project Apollo" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client (Optional)</Label>
                <Input value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} placeholder="Stark Industries" />
              </div>
              <div className="space-y-2">
                <Label>Manager Name</Label>
                <Input value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} placeholder="Tony Stark" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Technology</Label>
                <Input value={formData.technology} onChange={e => setFormData({...formData, technology: e.target.value})} placeholder="Next.js, FastAPI" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="Active">Active</option>
                    <option value="Planning">Planning</option>
                    <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            
            <Button type="submit" className="w-full mt-4">Initialize Project</Button>
            {msg && <p className="text-sm mt-2 text-blue-600">{msg}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
