"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";
import { Event, CreateTicketTypeRequest } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Plus, Edit, Trash2, Calendar, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    capacity: "",
    isActive: true,
  });
  
  const [ticketTypes, setTicketTypes] = useState<CreateTicketTypeRequest[]>([
    {
      name: "",
      category: "adult",
      price: 0,
      description: "",
      maxQuantityPerBooking: 10,
    },
  ]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.push("/");
      } else {
        loadEvent();
      }
    }
  }, [user, authLoading, eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await adminService.getEventWithTicketTypes(eventId);
      
      if (!response.success || !response.data) {
        setError("Failed to load event data");
        return;
      }
      
      const eventData = response.data;
      
      setEvent(eventData.event);
      setFormData({
        name: eventData.event.name,
        description: eventData.event.description || "",
        eventDate: eventData.event.event_date,
        startTime: eventData.event.start_time,
        endTime: eventData.event.end_time,
        capacity: eventData.event.capacity.toString(),
        isActive: eventData.event.is_active,
      });
      
      if (eventData.ticketTypes && eventData.ticketTypes.length > 0) {
        setTicketTypes(eventData.ticketTypes.map((tt: any) => ({
          name: tt.name,
          category: tt.category,
          price: parseFloat(tt.price),
          description: tt.description || "",
          maxQuantityPerBooking: tt.max_quantity_per_booking || 10,
        })));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const addTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        name: "",
        category: "adult",
        price: 0,
        description: "",
        maxQuantityPerBooking: 10,
      },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const updateTicketType = (index: number, field: keyof CreateTicketTypeRequest, value: any) => {
    const updatedTicketTypes = [...ticketTypes];
    updatedTicketTypes[index] = {
      ...updatedTicketTypes[index],
      [field]: value,
    };
    setTicketTypes(updatedTicketTypes);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Validate ticket types
      const invalidTicketType = ticketTypes.find(
        (tt) => !tt.name.trim() || tt.price <= 0
      );
      if (invalidTicketType) {
        setError("All ticket types must have a name and price greater than 0");
        return;
      }

      await adminService.updateEventWithTicketTypes(eventId, {
        name: formData.name,
        description: formData.description,
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        capacity: parseInt(formData.capacity, 10),
        isActive: formData.isActive,
        ticketTypes: ticketTypes.map((tt) => ({
          ...tt,
          price: parseFloat(tt.price.toString()),
        })),
      });

      router.push("/admin/events");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The event you're trying to edit doesn't exist.
          </p>
          <Button onClick={() => router.push("/admin/events")}>
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push("/admin/events")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Event
              </h1>
              <p className="text-gray-600">
                {event.name}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-900">
              Event Details
            </h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpdateEvent} className="space-y-6">
              {/* Event Information */}
              <div className="space-y-4">
                <Input
                  label="Event Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Summer Festival"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Event description..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Event Date"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({ ...formData, eventDate: e.target.value })
                    }
                    required
                  />
                  
                  <Input
                    label="Start Time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    required
                  />
                  
                  <Input
                    label="End Time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: e.target.value })
                    }
                    required
                    min="1"
                    placeholder="500"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.isActive.toString()}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.value === "true" })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ticket Types Section */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ticket Types
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addTicketType}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ticket Type
                  </Button>
                </div>
                
                {ticketTypes.map((ticketType, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 mb-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        Ticket Type {index + 1}
                      </h4>
                      {ticketTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeTicketType(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Ticket Name"
                        value={ticketType.name}
                        onChange={(e) =>
                          updateTicketType(index, "name", e.target.value)
                        }
                        required
                        placeholder="e.g., Adult Ticket"
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={ticketType.category}
                          onChange={(e) =>
                            updateTicketType(index, "category", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                          <option value="senior">Senior</option>
                          <option value="student">Student</option>
                          <option value="group">Group</option>
                        </select>
                      </div>
                      
                      <Input
                        label="Price (ETB)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={ticketType.price}
                        onChange={(e) =>
                          updateTicketType(index, "price", parseFloat(e.target.value) || 0)
                        }
                        required
                        placeholder="100.00"
                      />
                      
                      <Input
                        label="Max Quantity per Booking"
                        type="number"
                        min="1"
                        max="50"
                        value={ticketType.maxQuantityPerBooking}
                        onChange={(e) =>
                          updateTicketType(index, "maxQuantityPerBooking", parseInt(e.target.value) || 10)
                        }
                        placeholder="10"
                      />
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        value={ticketType.description}
                        onChange={(e) =>
                          updateTicketType(index, "description", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Describe this ticket type..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="flex-1"
                >
                  Update Event
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push("/admin/events")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
