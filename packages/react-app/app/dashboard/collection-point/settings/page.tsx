"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  IconMapPin,
  IconPhone,
  IconMail,
  IconBell,
  IconLock,
  IconUser,
  IconBuilding,
  IconClock,
} from "@tabler/icons-react"

export default function SettingsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your collection point preferences and configurations"
      />
      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your collection point details
            </p>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Collection Point Name</Label>
                <Input
                  id="name"
                  placeholder="Enter collection point name"
                  defaultValue="Main Street Collection Center"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a brief description"
                  defaultValue="A central collection point for recyclable materials serving the downtown area."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center gap-2">
                  <IconMapPin className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="Enter physical address"
                    defaultValue="123 Main Street, Downtown"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact Information</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="Phone number"
                      defaultValue="+1234567890"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email address"
                      defaultValue="contact@collectionpoint.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Operating Hours */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <IconClock className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Operating Hours</h2>
                <p className="text-sm text-muted-foreground">
                  Set your collection point's operating schedule
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Monday - Friday</Label>
                  <p className="text-sm text-muted-foreground">8:00 AM - 6:00 PM</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Hours
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Saturday</Label>
                  <p className="text-sm text-muted-foreground">9:00 AM - 4:00 PM</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Hours
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sunday</Label>
                  <p className="text-sm text-muted-foreground">Closed</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Hours
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <IconBell className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your notification preferences
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Collection Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new collection requests
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Capacity Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when storage capacity reaches threshold
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Performance Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly performance report notifications
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2">
              <IconLock className="h-5 w-5 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Security</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your security settings
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>
              <Button>Update Password</Button>
            </div>
          </div>
        </Card>

        {/* Team Members */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconUser className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">Team Members</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage collection point staff
                  </p>
                </div>
              </div>
              <Button>
                Add Team Member
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-muted-foreground">Manager</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Operator</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Changes */}
        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </DashboardShell>
  )
} 