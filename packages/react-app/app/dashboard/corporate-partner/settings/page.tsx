"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  IconBuildingSkyscraper,
  IconMail,
  IconPhone,
  IconMap,
  IconBell,
  IconLock,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconWorld,
} from "@tabler/icons-react"

interface SettingsSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings and preferences"
      />
      <div className="grid gap-6">
        {/* Company Profile */}
        <Card>
          <div className="p-6">
            <SettingsSection
              title="Company Profile"
              description="Update your company information and contact details"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Company Name</Label>
                  <div className="flex items-center gap-2">
                    <IconBuildingSkyscraper className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="Eco Solutions Inc." />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Business Email</Label>
                  <div className="flex items-center gap-2">
                    <IconMail className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="contact@ecosolutions.com" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="+254 123 456 789" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Business Address</Label>
                  <div className="flex items-center gap-2">
                    <IconMap className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="123 Green Street, Nairobi" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Company Description</Label>
                  <Textarea
                    defaultValue="Leading provider of sustainable solutions for waste management and recycling."
                    className="h-24"
                  />
                </div>
                <Button>Save Changes</Button>
              </div>
            </SettingsSection>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <div className="p-6">
            <SettingsSection
              title="Notification Preferences"
              description="Configure how you receive updates and alerts"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Certification Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about certification renewals
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Impact Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Monthly sustainability impact reports
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>News and Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Industry news and platform updates
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </SettingsSection>
          </div>
        </Card>

        {/* Security Settings */}
        <Card>
          <div className="p-6">
            <SettingsSection
              title="Security Settings"
              description="Manage your account security and authentication"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div>
                  <Button variant="outline">
                    <IconLock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>
              </div>
            </SettingsSection>
          </div>
        </Card>

        {/* Social Media Links */}
        <Card>
          <div className="p-6">
            <SettingsSection
              title="Social Media"
              description="Connect your social media accounts"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Website</Label>
                  <div className="flex items-center gap-2">
                    <IconWorld className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="https://ecosolutions.com" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>LinkedIn</Label>
                  <div className="flex items-center gap-2">
                    <IconBrandLinkedin className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="https://linkedin.com/company/ecosolutions" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Twitter</Label>
                  <div className="flex items-center gap-2">
                    <IconBrandTwitter className="h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="https://twitter.com/ecosolutions" />
                  </div>
                </div>
                <Button>Update Social Links</Button>
              </div>
            </SettingsSection>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <div className="p-6">
            <SettingsSection
              title="Danger Zone"
              description="Irreversible and destructive actions"
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-destructive/50 p-4">
                  <h3 className="font-medium text-destructive">Delete Account</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="destructive" className="mt-4">
                    Delete Account
                  </Button>
                </div>
              </div>
            </SettingsSection>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 